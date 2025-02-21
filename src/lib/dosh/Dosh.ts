import ReactNative, {Platform} from 'react-native';
import DoshUiOptions from './DoshUiOptions';

/**
 * NativeModule bridge to access the iOS or Android SDK methods.
 */
interface DoshModule {
  /**
   * This should be done before any other calls to the PoweredByDosh SDK.
   * TODO: pass in applicationId from JS?
   * @param uiOptions Required on Android. Options to customize the SDK's header title and brand page UI.
   */
  initializeDosh: (uiOptions: DoshUiOptions) => Promise<any>;

  /**
   * User authorization between the app and Dosh is coordinated by providing the SDK with an authorization token.
   * This token should be requested from the BitPay server.
   */
  setDoshToken: (token: string) => Promise<any>;

  /**
   * Present a full screen view that is managed by the SDK.
   */
  present: () => Promise<any>;

  /**
   * Any time the app's current user changes, such as when the user logs out, the user's information should be cleared.
   * As of now only written for the Android bridge.
   */
  clearUser: () => Promise<any>;

  /**
   * @deprecated For development purposes only. Do not call this in production.
   * As of now only written for the Android bridge.
   */
  presentIntegrationChecklist: () => Promise<any>;
}

/**
 * React JS wrapper for calling the Dosh SDK to handle differences in the iOS/Android call signatures/implementations.
 */
interface Dosh extends Omit<DoshModule, 'initializeDosh'> {
  /**
   * This should be done before any other calls to the PoweredByDosh SDK.
   */
  initializeDosh: (uiOptions: DoshUiOptions) => Promise<any>;
}

const DoshModule = ReactNative.NativeModules.Dosh as DoshModule;

const Dosh: Dosh = {
  initializeDosh(uiOptions?: DoshUiOptions) {
    const _uiOptions: DoshUiOptions = {
      feedTitle: 'Dosh Rewards',
      logoStyle: 'CIRCLE',
      brandDetailsHeaderStyle: 'RECTANGLE',

      ...(uiOptions || {}),
    };

    return DoshModule.initializeDosh(_uiOptions);
  },

  setDoshToken(token: string) {
    return DoshModule.setDoshToken(token);
  },

  present() {
    return DoshModule.present();
  },

  clearUser() {
    // TODO: iOS bridge method, let it throw for now
    return DoshModule.clearUser();
  },

  presentIntegrationChecklist() {
    if (Platform.OS === 'android') {
      return DoshModule.presentIntegrationChecklist();
    }

    // TODO: iOS bridge method, if exists. Since this is dev only, just resolve without error.
    return Promise.resolve();
  },
};

export default Dosh;
