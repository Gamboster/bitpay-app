import {DateRanges, Key, PriceHistory, Rates, Token} from './wallet.models';
import {WalletActionType, WalletActionTypes} from './wallet.types';
import {FeeLevels} from './effects/fee/fee';
import {DEFAULT_DATE_RANGE} from '../../constants/wallet';
import {CurrencyOpts} from '../../constants/currencies';

type WalletReduxPersistBlackList = [];
export const walletReduxPersistBlackList: WalletReduxPersistBlackList = [];

export interface WalletState {
  createdOn: number;
  keys: {[key in string]: Key};
  lastDayRates: Rates;
  rates: Rates;
  ratesByDateRange: {[key in DateRanges]: Rates};
  priceHistory: Array<PriceHistory>;
  tokenOptions: {[key in string]: Token};
  tokenData: {[key in string]: CurrencyOpts};
  tokenOptionsByAddress: {[key in string]: Token};
  customTokenOptions: {[key in string]: Token};
  customTokenData: {[key in string]: CurrencyOpts};
  customTokenOptionsByAddress: {[key in string]: Token};
  walletTermsAccepted: boolean;
  portfolioBalance: {
    current: number;
    lastDay: number;
    previous: number;
  };
  balanceCacheKey: {[key in string]: number | undefined};
  ratesCacheKey: {[key in number]: DateRanges | undefined};
  feeLevel: {[key in string]: FeeLevels};
  useUnconfirmedFunds: boolean;
  customizeNonce: boolean;
  enableReplaceByFee: boolean;
}

const initialState: WalletState = {
  createdOn: Date.now(),
  keys: {},
  rates: {},
  ratesByDateRange: {
    1: {},
    7: {},
    30: {},
  },
  lastDayRates: {},
  priceHistory: [],
  tokenOptions: {},
  tokenData: {},
  tokenOptionsByAddress: {},
  customTokenOptions: {},
  customTokenData: {},
  customTokenOptionsByAddress: {},
  walletTermsAccepted: false,
  portfolioBalance: {
    current: 0,
    lastDay: 0,
    previous: 0,
  },
  balanceCacheKey: {},
  ratesCacheKey: {},
  feeLevel: {
    btc: FeeLevels.NORMAL,
    eth: FeeLevels.NORMAL,
  },
  useUnconfirmedFunds: false,
  customizeNonce: false,
  enableReplaceByFee: false,
};

export const walletReducer = (
  state: WalletState = initialState,
  action: WalletActionType,
): WalletState => {
  switch (action.type) {
    case WalletActionTypes.SUCCESS_ADD_WALLET:
    case WalletActionTypes.SUCCESS_CREATE_KEY:
    case WalletActionTypes.SUCCESS_UPDATE_KEY:
    case WalletActionTypes.SUCCESS_IMPORT: {
      const {key} = action.payload;
      return {
        ...state,
        keys: {...state.keys, [key.id]: key},
      };
    }

    case WalletActionTypes.SET_BACKUP_COMPLETE: {
      const id = action.payload;
      const updatedKey = {...state.keys[id], backupComplete: true};

      return {
        ...state,
        keys: {...state.keys, [id]: updatedKey},
      };
    }

    case WalletActionTypes.SUCCESS_GET_RATES: {
      const {
        rates,
        ratesByDateRange,
        lastDayRates,
        dateRange = DEFAULT_DATE_RANGE,
      } = action.payload;

      return {
        ...state,
        rates: {...state.rates, ...rates},
        ratesByDateRange: {
          ...state.ratesByDateRange,
          [dateRange]: {...ratesByDateRange},
        },
        ratesCacheKey: {...state.ratesCacheKey, [dateRange]: Date.now()},
        lastDayRates: {...state.lastDayRates, ...lastDayRates},
      };
    }

    case WalletActionTypes.UPDATE_CACHE_KEY: {
      const {cacheKey, dateRange = DEFAULT_DATE_RANGE} = action.payload;
      return {
        ...state,
        [cacheKey]: {...state.ratesCacheKey, [dateRange]: Date.now()},
      };
    }

    case WalletActionTypes.SUCCESS_GET_PRICE_HISTORY: {
      return {
        ...state,
        priceHistory: action.payload,
      };
    }

    case WalletActionTypes.SUCCESS_UPDATE_WALLET_STATUS: {
      const {keyId, walletId, status} = action.payload;
      const keyToUpdate = state.keys[keyId];
      if (keyToUpdate) {
        keyToUpdate.wallets = keyToUpdate.wallets.map(wallet => {
          if (wallet.id === walletId) {
            wallet.balance = status.balance;
            wallet.pendingTxps = status.pendingTxps;
            wallet.isRefreshing = false;
          }
          return wallet;
        });
      }
      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
        balanceCacheKey: {
          ...state.balanceCacheKey,
          [walletId]: Date.now(),
        },
      };
    }

    case WalletActionTypes.FAILED_UPDATE_WALLET_STATUS: {
      const {keyId, walletId} = action.payload;
      const keyToUpdate = state.keys[keyId];
      if (keyToUpdate) {
        keyToUpdate.wallets = keyToUpdate.wallets.map(wallet => {
          if (wallet.id === walletId) {
            wallet.isRefreshing = false;
          }
          return wallet;
        });
      }
      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
      };
    }

    case WalletActionTypes.SUCCESS_UPDATE_KEY_TOTAL_BALANCE: {
      const {keyId, totalBalance, totalBalanceLastDay} = action.payload;
      const keyToUpdate = state.keys[keyId];
      keyToUpdate.totalBalance = totalBalance;
      keyToUpdate.totalBalanceLastDay = totalBalanceLastDay;
      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
        balanceCacheKey: {
          ...state.balanceCacheKey,
          [keyId]: Date.now(),
        },
      };
    }

    case WalletActionTypes.SUCCESS_UPDATE_ALL_KEYS_AND_STATUS: {
      return {
        ...state,
        balanceCacheKey: {
          ...state.balanceCacheKey,
          all: Date.now(),
        },
      };
    }

    case WalletActionTypes.UPDATE_PORTFOLIO_BALANCE: {
      let current = 0;
      let lastDay = 0;
      Object.values(state.keys).forEach(key => (current += key.totalBalance));
      Object.values(state.keys).forEach(
        key => (lastDay += key.totalBalanceLastDay),
      );
      return {
        ...state,
        portfolioBalance: {
          current,
          lastDay,
          previous: 0,
        },
      };
    }

    case WalletActionTypes.SUCCESS_ENCRYPT_OR_DECRYPT_PASSWORD: {
      const {key} = action.payload;
      const keyToUpdate = state.keys[key.id];
      keyToUpdate.isPrivKeyEncrypted = !!key.methods.isPrivKeyEncrypted();

      return {
        ...state,
        keys: {
          ...state.keys,
          [key.id]: {
            ...keyToUpdate,
            properties: key.methods.toObj(),
          },
        },
      };
    }

    case WalletActionTypes.DELETE_KEY: {
      const {keyId} = action.payload;
      const balanceToRemove = state.keys[keyId].totalBalance;
      delete state.keys[keyId];

      return {
        ...state,
        keys: {
          ...state.keys,
        },
        portfolioBalance: {
          current: state.portfolioBalance.current - balanceToRemove,
          lastDay: state.portfolioBalance.lastDay - balanceToRemove,
          previous: 0,
        },
      };
    }

    case WalletActionTypes.SUCCESS_GET_TOKEN_OPTIONS: {
      const {tokenOptions, tokenData, tokenOptionsByAddress} = action.payload;
      return {
        ...state,
        tokenOptions: {
          ...tokenOptions,
        },
        tokenData: {
          ...tokenData,
        },
        tokenOptionsByAddress: {
          ...tokenOptionsByAddress,
        },
      };
    }

    case WalletActionTypes.SUCCESS_GET_CUSTOM_TOKEN_OPTIONS: {
      const {customTokenOptions, customTokenData, customTokenOptionsByAddress} =
        action.payload;
      return {
        ...state,
        customTokenOptions: {
          ...state.customTokenOptions,
          ...customTokenOptions,
        },
        customTokenData: {
          ...state.customTokenData,
          ...customTokenData,
        },
        customTokenOptionsByAddress: {
          ...state.customTokenOptionsByAddress,
          ...customTokenOptionsByAddress,
        },
      };
    }

    case WalletActionTypes.SET_WALLET_TERMS_ACCEPTED: {
      return {
        ...state,
        walletTermsAccepted: true,
      };
    }

    case WalletActionTypes.SUCCESS_GET_RECEIVE_ADDRESS: {
      const {keyId, walletId, receiveAddress} = action.payload;
      const keyToUpdate = state.keys[keyId];
      keyToUpdate.wallets = keyToUpdate.wallets.map(wallet => {
        if (wallet.id === walletId) {
          wallet.receiveAddress = receiveAddress;
        }
        return wallet;
      });

      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
      };
    }

    case WalletActionTypes.UPDATE_KEY_NAME: {
      const {keyId, name} = action.payload;
      const keyToUpdate = state.keys[keyId];
      keyToUpdate.keyName = name;

      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
      };
    }

    case WalletActionTypes.UPDATE_WALLET_NAME: {
      const {keyId, walletId, name} = action.payload;
      const keyToUpdate = state.keys[keyId];
      keyToUpdate.wallets = keyToUpdate.wallets.map(wallet => {
        if (wallet.id === walletId) {
          wallet.walletName = name;
        }
        return wallet;
      });

      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
      };
    }

    case WalletActionTypes.SET_WALLET_REFRESHING: {
      const {keyId, walletId, isRefreshing} = action.payload;
      const keyToUpdate = state.keys[keyId];
      keyToUpdate.wallets = keyToUpdate.wallets.map(wallet => {
        if (wallet.id === walletId) {
          wallet.isRefreshing = isRefreshing;
        }
        return wallet;
      });

      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
      };
    }

    case WalletActionTypes.UPDATE_WALLET_TX_HISTORY: {
      const {keyId, walletId, transactionHistory} = action.payload;
      const keyToUpdate = state.keys[keyId];
      keyToUpdate.wallets = keyToUpdate.wallets.map(wallet => {
        if (wallet.id === walletId) {
          wallet.transactionHistory = transactionHistory;
        }
        return wallet;
      });

      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
      };
    }

    case WalletActionTypes.SET_USE_UNCONFIRMED_FUNDS: {
      return {
        ...state,
        useUnconfirmedFunds: action.payload,
      };
    }

    case WalletActionTypes.SET_CUSTOMIZE_NONCE: {
      return {
        ...state,
        customizeNonce: action.payload,
      };
    }

    case WalletActionTypes.SET_ENABLE_REPLACE_BY_FEE: {
      return {
        ...state,
        enableReplaceByFee: action.payload,
      };
    }

    case WalletActionTypes.SYNC_WALLETS: {
      const {keyId, wallets} = action.payload;
      const keyToUpdate = state.keys[keyId];
      keyToUpdate.wallets = keyToUpdate.wallets.concat(wallets);

      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
      };
    }

    case WalletActionTypes.TOGGLE_HIDE_WALLET: {
      const {
        wallet: {keyId, id},
      } = action.payload;
      const keyToUpdate = state.keys[keyId];
      keyToUpdate.wallets = keyToUpdate.wallets.map(wallet => {
        if (wallet.id === id) {
          wallet.hideWallet = !wallet.hideWallet;
        }
        return wallet;
      });

      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
      };
    }

    case WalletActionTypes.TOGGLE_HIDE_BALANCE: {
      const {
        wallet: {keyId, id},
      } = action.payload;
      const keyToUpdate = state.keys[keyId];
      keyToUpdate.wallets = keyToUpdate.wallets.map(wallet => {
        if (wallet.id === id) {
          wallet.hideBalance = !wallet.hideBalance;
        }
        return wallet;
      });

      return {
        ...state,
        keys: {
          ...state.keys,
          [keyId]: {
            ...keyToUpdate,
          },
        },
      };
    }

    case WalletActionTypes.UPDATE_CACHE_FEE_LEVEL: {
      const newFeeLevel = state.feeLevel;
      newFeeLevel[action.payload.currency] = action.payload.feeLevel;
      return {
        ...state,
        feeLevel: newFeeLevel,
      };
    }

    default:
      return state;
  }
};
