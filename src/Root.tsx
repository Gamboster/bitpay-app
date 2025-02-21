import {
  createNavigationContainerRef,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import debounce from 'lodash.debounce';
import React, {useEffect, useState} from 'react';
import {Appearance, AppState, AppStateStatus, StatusBar} from 'react-native';
import 'react-native-gesture-handler';
import {ThemeProvider} from 'styled-components/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import BottomNotificationModal from './components/modal/bottom-notification/BottomNotification';
import OnGoingProcessModal from './components/modal/ongoing-process/OngoingProcess';
import {
  baseNavigatorOptions,
  baseScreenOptions,
} from './constants/NavigationOptions';
import {LOCK_AUTHORIZED_TIME} from './constants/Lock';
import BiometricModal from './components/modal/biometric/BiometricModal';
import {AppEffects, AppActions} from './store/app';
import {BitPayDarkTheme, BitPayLightTheme} from './themes/bitpay';
import {LogActions} from './store/log';
import {useAppDispatch, useAppSelector, useDeeplinks} from './utils/hooks';
import analytics from '@segment/analytics-react-native';
import i18n from 'i18next';

import BitpayIdStack, {
  BitpayIdStackParamList,
} from './navigation/bitpay-id/BitpayIdStack';
import OnboardingStack, {
  OnboardingStackParamList,
} from './navigation/onboarding/OnboardingStack';
import TabsStack, {TabsStackParamList} from './navigation/tabs/TabsStack';
import WalletStack, {
  WalletStackParamList,
} from './navigation/wallet/WalletStack';
import ScanStack, {ScanStackParamList} from './navigation/scan/ScanStack';
import GeneralSettingsStack, {
  GeneralSettingsStackParamList,
} from './navigation/tabs/settings/general/GeneralStack';
import ContactsStack, {
  ContactsStackParamList,
} from './navigation/tabs/contacts/ContactsStack';
import ExternalServicesSettingsStack, {
  ExternalServicesSettingsStackParamList,
} from './navigation/tabs/settings/external-services/ExternalServicesStack';
import AboutStack, {
  AboutStackParamList,
} from './navigation/tabs/settings/about/AboutStack';
import AuthStack, {AuthStackParamList} from './navigation/auth/AuthStack';

import BuyCryptoStack, {
  BuyCryptoStackParamList,
} from './navigation/services/buy-crypto/BuyCryptoStack';
import SwapCryptoStack, {
  SwapCryptoStackParamList,
} from './navigation/services/swap-crypto/SwapCryptoStack';
import IntroStack, {IntroStackParamList} from './navigation/intro/IntroStack';
import WalletConnectStack, {
  WalletConnectStackParamList,
} from './navigation/wallet-connect/WalletConnectStack';
import {ShopStackParamList} from './navigation/tabs/shop/ShopStack';
import GiftCardStack, {
  GiftCardStackParamList,
} from './navigation/tabs/shop/gift-card/GiftCardStack';
import GiftCardDeeplinkScreen, {
  GiftCardDeeplinkScreenParamList,
} from './navigation/tabs/shop/gift-card/GiftCardDeeplink';
import DecryptEnterPasswordModal from './navigation/wallet/components/DecryptEnterPasswordModal';
import MerchantStack, {
  MerchantStackParamList,
} from './navigation/tabs/shop/merchant/MerchantStack';
import PinModal from './components/modal/pin/PinModal';
import CoinbaseStack, {
  CoinbaseStackParamList,
} from './navigation/coinbase/CoinbaseStack';
import BpDevtools from './components/bp-devtools/BpDevtools';
import {DEVTOOLS_ENABLED} from './constants/config';
import Blur from './components/blur/Blur';
import DebugScreen, {DebugScreenParamList} from './navigation/Debug';
import CardActivationStack, {
  CardActivationStackParamList,
} from './navigation/card-activation/CardActivationStack';

// ROOT NAVIGATION CONFIG
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Intro: NavigatorScreenParams<IntroStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Tabs: NavigatorScreenParams<TabsStackParamList>;
  BitpayId: NavigatorScreenParams<BitpayIdStackParamList>;
  Wallet: NavigatorScreenParams<WalletStackParamList>;
  CardActivation: NavigatorScreenParams<CardActivationStackParamList>;
  Scan: NavigatorScreenParams<ScanStackParamList>;
  Shop: NavigatorScreenParams<ShopStackParamList>;
  GiftCard: NavigatorScreenParams<GiftCardStackParamList>;
  GiftCardDeeplink: GiftCardDeeplinkScreenParamList;
  Merchant: NavigatorScreenParams<MerchantStackParamList>;
  GeneralSettings: NavigatorScreenParams<GeneralSettingsStackParamList>;
  Contacts: NavigatorScreenParams<ContactsStackParamList>;
  ExternalServicesSettings: NavigatorScreenParams<ExternalServicesSettingsStackParamList>;
  About: NavigatorScreenParams<AboutStackParamList>;
  Coinbase: NavigatorScreenParams<CoinbaseStackParamList>;
  BuyCrypto: NavigatorScreenParams<BuyCryptoStackParamList>;
  SwapCrypto: NavigatorScreenParams<SwapCryptoStackParamList>;
  WalletConnect: NavigatorScreenParams<WalletConnectStackParamList>;
  Debug: DebugScreenParamList;
};
// ROOT NAVIGATION CONFIG
export enum RootStacks {
  HOME = 'Home',
  AUTH = 'Auth',
  INTRO = 'Intro',
  ONBOARDING = 'Onboarding',
  TABS = 'Tabs',
  BITPAY_ID = 'BitpayId',
  WALLET = 'Wallet',
  CARD_ACTIVATION = 'CardActivation',
  SCAN = 'Scan',
  CONTACTS = 'Contacts',
  GIFT_CARD = 'GiftCard',
  GIFT_CARD_DEEPLINK = 'GiftCardDeeplink',
  MERCHANT = 'Merchant',
  // SETTINGS
  GENERAL_SETTINGS = 'GeneralSettings',
  EXTERNAL_SERVICES_SETTINGS = 'ExternalServicesSettings',
  ABOUT = 'About',
  COINBASE = 'Coinbase',
  BUY_CRYPTO = 'BuyCrypto',
  SWAP_CRYPTO = 'SwapCrypto',
  WALLET_CONNECT = 'WalletConnect',
  DEBUG = 'Debug',
}

// ROOT NAVIGATION CONFIG
export type NavScreenParams = NavigatorScreenParams<
  AuthStackParamList &
    OnboardingStackParamList &
    BitpayIdStackParamList &
    WalletStackParamList &
    CardActivationStackParamList &
    GiftCardStackParamList &
    MerchantStackParamList &
    GeneralSettingsStackParamList &
    ContactsStackParamList &
    ExternalServicesSettingsStackParamList &
    AboutStackParamList &
    CoinbaseStackParamList &
    BuyCryptoStackParamList &
    SwapCryptoStackParamList &
    ScanStackParamList &
    WalletConnectStackParamList
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
export const navigate = (
  name: keyof RootStackParamList,
  params: NavScreenParams,
) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

const Root = createStackNavigator<RootStackParamList>();

export default () => {
  const dispatch = useAppDispatch();
  const [, rerender] = useState({});
  const linking = useDeeplinks();
  const onboardingCompleted = useAppSelector(
    ({APP}) => APP.onboardingCompleted,
  );
  const introCompleted = useAppSelector(({APP}) => APP.introCompleted);
  const appIsLoading = useAppSelector(({APP}) => APP.appIsLoading);
  const appColorScheme = useAppSelector(({APP}) => APP.colorScheme);
  const currentRoute = useAppSelector(({APP}) => APP.currentRoute);
  const appLanguage = useAppSelector(({APP}) => APP.defaultLanguage);
  const pinLockActive = useAppSelector(({APP}) => APP.pinLockActive);
  const showBlur = useAppSelector(({APP}) => APP.showBlur);
  const biometricLockActive = useAppSelector(
    ({APP}) => APP.biometricLockActive,
  );
  const lockAuthorizedUntil = useAppSelector(
    ({APP}) => APP.lockAuthorizedUntil,
  );
  const user = useAppSelector(
    ({APP, BITPAY_ID}) => BITPAY_ID.user[APP.network],
  );

  // MAIN APP INIT
  useEffect(() => {
    dispatch(AppEffects.startAppInit());
  }, [dispatch]);

  // LANGUAGE
  useEffect(() => {
    if (appLanguage && appLanguage !== i18n.language) {
      i18n.changeLanguage(appLanguage);
    }
  }, [appLanguage]);

  // CHECK PIN || BIOMETRIC
  useEffect(() => {
    function onAppStateChange(status: AppStateStatus) {
      // status === 'active' when the app goes from background to foreground,

      const showLockOption = () => {
        if (biometricLockActive) {
          dispatch(AppActions.showBiometricModal());
        } else if (pinLockActive) {
          dispatch(AppActions.showPinModal({type: 'check'}));
        } else {
          dispatch(AppActions.showBlur(false));
        }
      };

      if (onboardingCompleted) {
        if (status === 'active' && !appIsLoading) {
          if (lockAuthorizedUntil) {
            const now = Math.floor(Date.now() / 1000);
            const totalSecs = lockAuthorizedUntil - now;
            if (totalSecs < 0) {
              dispatch(AppActions.lockAuthorizedUntil(undefined));
              showLockOption();
            } else {
              const authorizedUntil =
                Math.floor(Date.now() / 1000) + LOCK_AUTHORIZED_TIME;
              dispatch(AppActions.lockAuthorizedUntil(authorizedUntil));
              dispatch(AppActions.showBlur(false));
            }
          } else {
            showLockOption();
          }
        } else {
          dispatch(AppActions.showBlur(true));
        }
      }
    }
    AppState.addEventListener('change', onAppStateChange);
    return () => AppState.removeEventListener('change', onAppStateChange);
  }, [
    dispatch,
    onboardingCompleted,
    pinLockActive,
    lockAuthorizedUntil,
    biometricLockActive,
    appIsLoading,
  ]);

  // THEME
  useEffect(() => {
    function onAppStateChange(status: AppStateStatus) {
      // status === 'active' when the app goes from background to foreground,
      // if no app scheme set, rerender in case the system theme has changed
      if (status === 'active' && !appColorScheme) {
        rerender({});
      }
    }

    AppState.addEventListener('change', onAppStateChange);

    return () => AppState.removeEventListener('change', onAppStateChange);
  }, [rerender, appColorScheme]);

  const scheme = appColorScheme || Appearance.getColorScheme();
  const theme = scheme === 'dark' ? BitPayDarkTheme : BitPayLightTheme;

  // ROOT STACKS AND GLOBAL COMPONENTS
  const initialRoute = onboardingCompleted
    ? RootStacks.TABS
    : introCompleted
    ? RootStacks.ONBOARDING
    : RootStacks.INTRO;

  const showDevtools = __DEV__ && DEVTOOLS_ENABLED;

  return (
    <SafeAreaProvider>
      <StatusBar
        animated={true}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={'transparent'}
        translucent={true}
      />

      <ThemeProvider theme={theme}>
        {showDevtools ? <BpDevtools /> : null}

        <NavigationContainer
          ref={navigationRef}
          theme={theme}
          linking={linking}
          onReady={() => {
            // routing to previous route if onboarding
            if (currentRoute && !onboardingCompleted) {
              const [currentStack, params] = currentRoute;
              navigationRef.navigate(currentStack, params);
              dispatch(
                LogActions.info(
                  `Navigating to cached route... ${currentStack} ${JSON.stringify(
                    params,
                  )}`,
                ),
              );
            }
          }}
          onStateChange={debounce(navEvent => {
            // storing current route
            if (navEvent) {
              const {routes} = navEvent;
              let {name, params} = navEvent.routes[routes.length - 1];
              dispatch(AppActions.setCurrentRoute([name, params]));
              dispatch(LogActions.info(`Navigation event... ${name}`));
              if (!__DEV__) {
                if (name === 'Tabs') {
                  const {history} = navEvent.routes[routes.length - 1].state;
                  const tabName = history[history.length - 1].key.split('-')[0];
                  name = `${tabName} Tab`;
                }
                analytics.screen(name, {
                  screen: params?.screen || '',
                  appUser: user?.eid || '',
                });
              }
            }
          }, 300)}>
          <Root.Navigator
            screenOptions={{
              ...baseScreenOptions,
              headerShown: false,
            }}
            initialRouteName={initialRoute}>
            <Root.Screen
              name={RootStacks.DEBUG}
              component={DebugScreen}
              options={{
                ...baseNavigatorOptions,
                headerShown: true,
                headerTitle: 'Debug',
              }}
            />
            <Root.Screen name={RootStacks.AUTH} component={AuthStack} />
            <Root.Screen name={RootStacks.INTRO} component={IntroStack} />
            <Root.Screen
              name={RootStacks.ONBOARDING}
              component={OnboardingStack}
            />
            <Root.Screen
              name={RootStacks.TABS}
              component={TabsStack}
              options={{
                gestureEnabled: false,
              }}
            />
            <Root.Screen
              name={RootStacks.BITPAY_ID}
              component={BitpayIdStack}
            />
            <Root.Screen
              options={{
                gestureEnabled: false,
              }}
              name={RootStacks.WALLET}
              component={WalletStack}
            />
            <Root.Screen
              name={RootStacks.CARD_ACTIVATION}
              component={CardActivationStack}
              options={{
                gestureEnabled: false,
              }}
            />
            <Root.Screen name={RootStacks.SCAN} component={ScanStack} />
            <Root.Screen
              name={RootStacks.GIFT_CARD}
              component={GiftCardStack}
            />
            <Root.Screen
              name={RootStacks.GIFT_CARD_DEEPLINK}
              component={GiftCardDeeplinkScreen}
            />
            <Root.Screen name={RootStacks.MERCHANT} component={MerchantStack} />
            {/* SETTINGS */}
            <Root.Screen
              name={RootStacks.GENERAL_SETTINGS}
              component={GeneralSettingsStack}
            />
            <Root.Screen name={RootStacks.CONTACTS} component={ContactsStack} />
            <Root.Screen
              name={RootStacks.EXTERNAL_SERVICES_SETTINGS}
              component={ExternalServicesSettingsStack}
            />
            <Root.Screen name={RootStacks.ABOUT} component={AboutStack} />
            <Root.Screen name={RootStacks.COINBASE} component={CoinbaseStack} />
            <Root.Screen
              name={RootStacks.BUY_CRYPTO}
              component={BuyCryptoStack}
            />
            <Root.Screen
              name={RootStacks.SWAP_CRYPTO}
              component={SwapCryptoStack}
              options={{
                gestureEnabled: false,
              }}
            />
            <Root.Screen
              name={RootStacks.WALLET_CONNECT}
              component={WalletConnectStack}
            />
          </Root.Navigator>
          <OnGoingProcessModal />
          <BottomNotificationModal />
          <DecryptEnterPasswordModal />
          {showBlur && <Blur />}
          <PinModal />
          <BiometricModal />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
