import React, {useLayoutEffect, useRef} from 'react';
import {
  BaseText,
  HeaderTitle,
  Link,
  InfoTitle,
  InfoHeader,
  InfoDescription,
} from '../../../components/styled/Text';
import {useNavigation, useRoute} from '@react-navigation/native';
import {RouteProp} from '@react-navigation/core';
import {WalletStackParamList} from '../WalletStack';
import {View, TouchableOpacity, ScrollView} from 'react-native';
import styled from 'styled-components/native';
import {
  ActiveOpacity,
  Hr,
  Info,
  InfoTriangle,
  ScreenGutter,
  Setting,
  SettingTitle,
  SettingView,
  InfoImageContainer,
} from '../../../components/styled/Containers';
import ChevronRightSvg from '../../../../assets/img/angle-right.svg';
import haptic from '../../../components/haptic-feedback/haptic';
import WalletSettingsRow from '../../../components/list/WalletSettingsRow';
import {SlateDark, White} from '../../../styles/colors';
import {
  openUrlWithInAppBrowser,
  startOnGoingProcessModal,
} from '../../../store/app/app.effects';
import InfoSvg from '../../../../assets/img/info.svg';
import RequestEncryptPasswordToggle from '../components/RequestEncryptPasswordToggle';
import {buildNestedWalletList} from './KeyOverview';
import {URL} from '../../../constants';
import {getMnemonic} from '../../../utils/helper-methods';
import {useAppDispatch, useAppSelector} from '../../../utils/hooks';
import {AppActions} from '../../../store/app';
import {sleep} from '../../../utils/helper-methods';
import {
  dismissOnGoingProcessModal,
  showBottomNotificationModal,
} from '../../../store/app/app.actions';
import {
  CustomErrorMessage,
  WrongPasswordError,
} from '../components/ErrorMessages';
import {
  buildWalletObj,
  generateKeyExportCode,
} from '../../../store/wallet/utils/wallet';
import {Key} from '../../../store/wallet/wallet.models';
import {
  normalizeMnemonic,
  serverAssistedImport,
} from '../../../store/wallet/effects';
import {OnGoingProcessMessages} from '../../../components/modal/ongoing-process/OngoingProcess';
import merge from 'lodash.merge';
import {syncWallets} from '../../../store/wallet/wallet.actions';
import {BWCErrorMessage} from '../../../constants/BWCError';
import {RootState} from '../../../store';
import {BitpaySupportedTokenOpts} from '../../../constants/tokens';

const WalletSettingsContainer = styled.View`
  flex: 1;
`;

const ScrollContainer = styled.ScrollView`
  margin-top: 20px;
  padding: 0 ${ScreenGutter};
`;

const Title = styled(BaseText)`
  font-weight: bold;
  font-size: 18px;
  margin: 5px 0;
  color: ${({theme}) => theme.colors.text};
`;

const WalletHeaderContainer = styled.View`
  padding-top: ${ScreenGutter};
  flex-direction: row;
  align-items: center;
`;

const WalletNameContainer = styled.TouchableOpacity`
  padding: 10px 0 20px 0;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const VerticalPadding = styled.View`
  padding: ${ScreenGutter} 0;
`;

const WalletSettingsTitle = styled(SettingTitle)`
  color: ${({theme: {dark}}) => (dark ? White : SlateDark)};
`;

const KeySettings = () => {
  const {
    params: {key, context},
  } = useRoute<RouteProp<WalletStackParamList, 'KeySettings'>>();
  const scrollViewRef = useRef<ScrollView>(null);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const defaultAltCurrency = useAppSelector(({APP}) => APP.defaultAltCurrency);

  const _wallets = key.wallets;
  const coins = _wallets.filter(wallet => !wallet.credentials.token);
  const tokens = _wallets.filter(wallet => wallet.credentials.token);
  const wallets = buildNestedWalletList(
    coins,
    tokens,
    defaultAltCurrency.isoCode,
  );

  const _key: Key = useAppSelector(({WALLET}) => WALLET.keys[key.id]);
  const {keyName} = _key || {};

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <HeaderTitle>Key Settings</HeaderTitle>,
    });
    if (context === 'createEncryptPassword') {
      navigation.navigate('Wallet', {
        screen: 'CreateEncryptPassword',
        params: {key},
      });
      scrollViewRef?.current?.scrollToEnd({animated: false});
    }
  });

  const buildEncryptModalConfig = (
    cta: (decryptedKey: {
      mnemonic: string;
      mnemonicHasPassphrase: boolean;
      xPrivKey: string;
    }) => void,
  ) => {
    return {
      onSubmitHandler: async (encryptPassword: string) => {
        try {
          const decryptedKey = key.methods.get(encryptPassword);
          dispatch(AppActions.dismissDecryptPasswordModal());
          await sleep(300);
          cta(decryptedKey);
        } catch (e) {
          console.log(`Decrypt Error: ${e}`);
          await dispatch(AppActions.dismissDecryptPasswordModal());
          await sleep(500); // Wait to close Decrypt Password modal
          dispatch(showBottomNotificationModal(WrongPasswordError()));
        }
      },
      description: 'To continue please enter your encryption password.',
      onCancelHandler: () => null,
    };
  };

  const _tokenOptions = useAppSelector(({WALLET}: RootState) => {
    return {
      ...BitpaySupportedTokenOpts,
      ...WALLET.tokenOptions,
      ...WALLET.customTokenOptions,
    };
  });

  const startSyncWallets = async (mnemonic: string) => {
    if (_key.isPrivKeyEncrypted) {
      // To close decrypt modal
      await sleep(500);
    }
    await dispatch(
      startOnGoingProcessModal(OnGoingProcessMessages.SYNCING_WALLETS),
    );
    const opts = {
      words: normalizeMnemonic(mnemonic),
      mnemonic,
    };
    try {
      let {key: _syncKey, wallets: _syncWallets} = await serverAssistedImport(
        opts,
      );
      if (_syncKey.fingerPrint === key.properties.fingerPrint) {
        // Filter for new wallets
        _syncWallets = _syncWallets
          .filter(
            sw =>
              sw.isComplete() &&
              !_key.wallets.some(ew => ew.id === sw.credentials.walletId),
          )
          .map(syncWallet => {
            // update to keyId
            syncWallet.credentials.keyId = key.properties.id;
            return merge(
              syncWallet,
              dispatch(buildWalletObj(syncWallet.credentials, _tokenOptions)),
            );
          });

        let message;

        const syncWalletsLength = _syncWallets.length;
        if (syncWalletsLength) {
          message =
            syncWalletsLength === 1
              ? 'New wallet found'
              : `${syncWalletsLength} wallets found`;
          dispatch(syncWallets({keyId: _key.id, wallets: _syncWallets}));
        } else {
          message = 'Your key is already synced';
        }

        dispatch(dismissOnGoingProcessModal());
        await sleep(500);
        dispatch(
          showBottomNotificationModal({
            type: 'error',
            title: 'Sync wallet',
            message,
            enableBackdropDismiss: true,
            actions: [
              {
                text: 'OK',
                action: () => {},
                primary: true,
              },
            ],
          }),
        );
      } else {
        dispatch(dismissOnGoingProcessModal());
        await sleep(500);
        await dispatch(
          showBottomNotificationModal(
            CustomErrorMessage({
              errMsg: 'Failed to Sync wallets',
            }),
          ),
        );
      }
    } catch (e) {
      dispatch(dismissOnGoingProcessModal());
      await sleep(500);
      await dispatch(
        showBottomNotificationModal(
          CustomErrorMessage({
            errMsg: BWCErrorMessage(e),
            title: 'Error',
          }),
        ),
      );
    }
  };

  return (
    <WalletSettingsContainer>
      <ScrollContainer ref={scrollViewRef}>
        <WalletNameContainer
          activeOpacity={ActiveOpacity}
          onPress={() => {
            haptic('impactLight');
            navigation.navigate('Wallet', {
              screen: 'UpdateKeyOrWalletName',
              params: {key, context: 'key'},
            });
          }}>
          <View>
            <Title>Key Name</Title>
            <WalletSettingsTitle>{keyName}</WalletSettingsTitle>
          </View>

          <ChevronRightSvg height={16} />
        </WalletNameContainer>
        <Hr />

        <WalletHeaderContainer>
          <Title>Wallets</Title>
          <InfoImageContainer infoMargin={'0 0 0 8px'}>
            <TouchableOpacity
              onPress={() => {
                haptic('impactLight');
                navigation.navigate('Wallet', {screen: 'KeyExplanation'});
              }}>
              <InfoSvg />
            </TouchableOpacity>
          </InfoImageContainer>
        </WalletHeaderContainer>

        {wallets.map(
          ({
            id,
            currencyName,
            img,
            isToken,
            network,
            hideWallet,
            walletName,
          }) => (
            <TouchableOpacity
              onPress={() => {
                haptic('impactLight');
                navigation.navigate('Wallet', {
                  screen: 'WalletSettings',
                  params: {walletId: id, key},
                });
              }}
              key={id}
              activeOpacity={ActiveOpacity}>
              <WalletSettingsRow
                id={id}
                img={img}
                currencyName={currencyName}
                key={id}
                isToken={isToken}
                network={network}
                hideWallet={hideWallet}
                walletName={walletName}
              />
            </TouchableOpacity>
          ),
        )}

        <VerticalPadding style={{alignItems: 'center'}}>
          <Link
            onPress={() => {
              haptic('impactLight');
              navigation.navigate('Wallet', {
                screen: 'CurrencySelection',
                params: {context: 'addWallet', key},
              });
            }}>
            Add a wallet
          </Link>
        </VerticalPadding>

        <VerticalPadding>
          <Title>Security</Title>
          <Setting
            onPress={() => {
              haptic('impactLight');
              if (!_key.isPrivKeyEncrypted) {
                navigation.navigate('Wallet', {
                  screen: 'RecoveryPhrase',
                  params: {
                    keyId: key.id,
                    words: getMnemonic(_key),
                    walletTermsAccepted: true,
                    context: 'keySettings',
                    key,
                  },
                });
              } else {
                dispatch(
                  AppActions.showDecryptPasswordModal(
                    buildEncryptModalConfig(async ({mnemonic}) => {
                      navigation.navigate('Wallet', {
                        screen: 'RecoveryPhrase',
                        params: {
                          keyId: key.id,
                          words: mnemonic.trim().split(' '),
                          walletTermsAccepted: true,
                          context: 'keySettings',
                          key,
                        },
                      });
                    }),
                  ),
                );
              }
            }}>
            <WalletSettingsTitle>Backup</WalletSettingsTitle>
          </Setting>

          <Hr />

          <SettingView>
            <WalletSettingsTitle>Request Encrypt Password</WalletSettingsTitle>

            <RequestEncryptPasswordToggle currentKey={key} />
          </SettingView>

          <Info>
            <InfoTriangle />

            <InfoHeader>
              <InfoImageContainer infoMargin={'0 8px 0 0'}>
                <InfoSvg />
              </InfoImageContainer>

              <InfoTitle>Password Not Recoverable</InfoTitle>
            </InfoHeader>
            <InfoDescription>
              This password cannot be recovered. If this password is lost, funds
              can only be recovered by reimporting your 12-word recovery phrase.
            </InfoDescription>

            <VerticalPadding>
              <TouchableOpacity
                activeOpacity={ActiveOpacity}
                onPress={() => {
                  haptic('impactLight');
                  dispatch(openUrlWithInAppBrowser(URL.HELP_SPENDING_PASSWORD));
                }}>
                <Link>Learn More</Link>
              </TouchableOpacity>
            </VerticalPadding>
          </Info>

          <Hr />

          {key.methods.isPrivKeyEncrypted() ? (
            <>
              <SettingView>
                <Setting
                  activeOpacity={ActiveOpacity}
                  onPress={() => {
                    navigation.navigate('Wallet', {
                      screen: 'ClearEncryptPassword',
                      params: {keyId: key.id},
                    });
                  }}>
                  <WalletSettingsTitle>
                    Clear Encrypt Password
                  </WalletSettingsTitle>
                </Setting>
              </SettingView>
              <Hr />
            </>
          ) : null}
        </VerticalPadding>

        <VerticalPadding>
          <Title>Advanced</Title>
          <Setting
            activeOpacity={ActiveOpacity}
            onPress={() => {
              haptic('impactLight');
              if (!_key.isPrivKeyEncrypted) {
                startSyncWallets(_key.properties.mnemonic);
              } else {
                dispatch(
                  AppActions.showDecryptPasswordModal(
                    buildEncryptModalConfig(async ({mnemonic}) => {
                      startSyncWallets(mnemonic);
                    }),
                  ),
                );
              }
            }}>
            <WalletSettingsTitle>
              Sync Wallets Across Devices
            </WalletSettingsTitle>
          </Setting>
          <Hr />

          <Setting
            activeOpacity={ActiveOpacity}
            onPress={() => {
              haptic('impactLight');
              if (!_key.isPrivKeyEncrypted) {
                navigation.navigate('Wallet', {
                  screen: 'ExportKey',
                  params: {
                    code: generateKeyExportCode(_key, _key.properties.mnemonic),
                    keyName,
                  },
                });
              } else {
                dispatch(
                  AppActions.showDecryptPasswordModal(
                    buildEncryptModalConfig(async ({mnemonic}) => {
                      const code = generateKeyExportCode(key, mnemonic);
                      navigation.navigate('Wallet', {
                        screen: 'ExportKey',
                        params: {code, keyName},
                      });
                    }),
                  ),
                );
              }
            }}>
            <WalletSettingsTitle>Export Key</WalletSettingsTitle>
          </Setting>
          <Hr />

          <Setting
            activeOpacity={ActiveOpacity}
            onPress={() => {
              haptic('impactLight');
              if (!_key.isPrivKeyEncrypted) {
                navigation.navigate('Wallet', {
                  screen: 'ExtendedPrivateKey',
                  params: {
                    xPrivKey: _key.properties.xPrivKey,
                  },
                });
              } else {
                dispatch(
                  AppActions.showDecryptPasswordModal(
                    buildEncryptModalConfig(async ({xPrivKey}) => {
                      navigation.navigate('Wallet', {
                        screen: 'ExtendedPrivateKey',
                        params: {xPrivKey},
                      });
                    }),
                  ),
                );
              }
            }}>
            <WalletSettingsTitle>Extended Private Key</WalletSettingsTitle>
          </Setting>
          <Hr />

          <Setting
            activeOpacity={ActiveOpacity}
            style={{marginBottom: 50}}
            onPress={() => {
              haptic('impactLight');
              navigation.navigate('Wallet', {
                screen: 'DeleteKey',
                params: {keyId: key.id},
              });
            }}>
            <WalletSettingsTitle>Delete</WalletSettingsTitle>
          </Setting>
        </VerticalPadding>
      </ScrollContainer>
    </WalletSettingsContainer>
  );
};

export default KeySettings;
