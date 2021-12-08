import {Network} from '../../constants';
import {
  BitPayIdActionType,
  BitPayIdActionTypes,
} from '../bitpay-id/bitpay-id.types';
import {Card} from './card.models';
import {CardActionType, CardActionTypes} from './card.types';

export const cardReduxPersistBlacklist: Array<keyof CardState> = [
  'fetchCardsStatus',
];

export type FetchCardsStatus = 'success' | 'failed' | null;

export interface CardState {
  cards: {
    [key in Network]: Card[];
  };
  fetchCardsStatus: FetchCardsStatus;
}

const initialState: CardState = {
  cards: {
    [Network.mainnet]: [],
    [Network.testnet]: [],
  },
  fetchCardsStatus: null,
};

export const cardReducer = (
  state: CardState = initialState,
  action: CardActionType | BitPayIdActionType,
): CardState => {
  switch (action.type) {
    case BitPayIdActionTypes.BITPAY_ID_DISCONNECTED:
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.network]: [],
        },
      };
    case CardActionTypes.SUCCESS_FETCH_CARDS:
      return {
        ...state,
        fetchCardsStatus: 'success',
        cards: {
          ...state.cards,
          [action.payload.network]: action.payload.cards,
        },
      };
    case CardActionTypes.FAILED_FETCH_CARDS:
      return {
        ...state,
        fetchCardsStatus: 'failed',
      };
    case CardActionTypes.UPDATE_FETCH_CARDS_STATUS:
      return {
        ...state,
        fetchCardsStatus: action.payload,
      };
    default:
      return state;
  }
};
