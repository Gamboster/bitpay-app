import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import moment from 'moment';
import {Settings, SettingsContainer} from '../../SettingsRoot';
import haptic from '../../../../../components/haptic-feedback/haptic';
import WyreLogo from '../../../../../components/icons/external-services/wyre/wyre-logo';
import {wyrePaymentData} from '../../../../../store/buy-crypto/buy-crypto.models';
import {useAppDispatch} from '../../../../../utils/hooks';
import {
  dismissOnGoingProcessModal,
  showBottomNotificationModal,
  dismissBottomNotificationModal,
} from '../../../../../store/app/app.actions';
import {BuyCryptoActions} from '../../../../../store/buy-crypto';
import {
  RowDataContainer,
  CryptoAmountContainer,
  CryptoTitle,
  CryptoContainer,
  CryptoAmount,
  CryptoUnit,
  RowLabel,
  RowData,
  LabelTip,
  LabelTipText,
  ColumnDataContainer,
  ColumnData,
  RemoveCta,
} from '../styled/ExternalServicesDetails';
import {sleep} from '../../../../../utils/helper-methods';
import {useLogger} from '../../../../../utils/hooks/useLogger';
import {startOnGoingProcessModal} from '../../../../../store/app/app.effects';
import {OnGoingProcessMessages} from '../../../../../components/modal/ongoing-process/OngoingProcess';
import {wyreGetWalletOrderDetails} from '../../../../../store/buy-crypto/effects/wyre/wyre';
import {handleWyreStatus} from '../../../../services/buy-crypto/utils/wyre-utils';

export interface WyreDetailsProps {
  paymentRequest: wyrePaymentData;
}

const WyreDetails: React.FC = () => {
  const {
    params: {paymentRequest},
  } = useRoute<RouteProp<{params: WyreDetailsProps}>>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const logger = useLogger();
  const [paymentData, setPaymentData] =
    useState<wyrePaymentData>(paymentRequest);

  useEffect(() => {
    const getWalletOrderDetails = async (orderId: string) => {
      dispatch(
        startOnGoingProcessModal(OnGoingProcessMessages.GENERAL_AWAITING),
      );
      await sleep(400);
      const orderData = await wyreGetWalletOrderDetails(orderId);
      if (orderData.status) {
        paymentRequest.status = handleWyreStatus(orderData.status);
      }
      if (orderData.blockchainNetworkTx) {
        paymentRequest.blockchainNetworkTx = orderData.blockchainNetworkTx;
      }
      if (orderData.destAmount) {
        paymentRequest.destAmount = orderData.destAmount;
      }
      setPaymentData(paymentRequest);

      dispatch(
        BuyCryptoActions.successPaymentRequestWyre({
          wyrePaymentData: paymentRequest,
        }),
      );
    };

    if (
      paymentRequest.orderId &&
      (paymentRequest.status != 'success' ||
        !paymentRequest.transferId ||
        (paymentRequest.transferId && !paymentRequest.blockchainNetworkTx))
    ) {
      getWalletOrderDetails(paymentRequest.orderId)
        .then(async () => {
          dispatch(dismissOnGoingProcessModal());
          await sleep(400);
        })
        .catch(err => {
          logger.error(
            'Wyre getWalletOrderDetails Error: ' + JSON.stringify(err),
          );
        });
    }
  }, []);

  return (
    <SettingsContainer>
      <Settings>
        <RowDataContainer>
          <CryptoAmountContainer>
            <CryptoTitle>Approximate receiving amount</CryptoTitle>
            <CryptoContainer>
              <CryptoAmount>{paymentData.destAmount}</CryptoAmount>
              <CryptoUnit>{paymentData.destCurrency}</CryptoUnit>
            </CryptoContainer>
          </CryptoAmountContainer>
          <WyreLogo iconOnly={true} width={45} height={40} />
        </RowDataContainer>

        <RowDataContainer>
          <RowLabel>Approximate receiving fiat amount</RowLabel>
          <RowData>
            {paymentData.purchaseAmount} {paymentData.sourceCurrency}
          </RowData>
        </RowDataContainer>
        <LabelTip type="warn">
          <LabelTipText>
            The final crypto amount you receive when the transaction is complete
            may differ because it is based on Wyre's exchange rate.
          </LabelTipText>
        </LabelTip>

        <RowDataContainer>
          <RowLabel>Paying</RowLabel>
          <RowData>
            {paymentData.sourceAmount} {paymentData.sourceCurrency}
          </RowData>
        </RowDataContainer>

        <RowDataContainer>
          <RowLabel>Created</RowLabel>
          <RowData>
            {moment(paymentData.created_on).format('MMM DD, YYYY hh:mm a')}
          </RowData>
        </RowDataContainer>

        {!!paymentData.status && (
          <RowDataContainer>
            <RowLabel>Status</RowLabel>
            <RowData>
              {paymentData.status === 'paymentRequestSent' && (
                <Text>Processing payment request</Text>
              )}
              {paymentData.status === 'failed' && (
                <Text style={{color: '#df5264'}}>Payment request rejected</Text>
              )}
              {paymentData.status === 'success' && (
                <Text style={{color: '#01d1a2'}}>Payment request approved</Text>
              )}
            </RowData>
          </RowDataContainer>
        )}

        {!!paymentData.dest && (
          <ColumnDataContainer>
            <RowLabel>Deposit address</RowLabel>
            <ColumnData>{paymentData.dest}</ColumnData>
          </ColumnDataContainer>
        )}

        {!!paymentData.paymentMethodName && (
          <ColumnDataContainer>
            <RowLabel>Payment method</RowLabel>
            <ColumnData>{paymentData.paymentMethodName}</ColumnData>
          </ColumnDataContainer>
        )}

        {!!paymentData.transferId && (
          <ColumnDataContainer>
            <RowLabel>Transfer ID</RowLabel>
            <ColumnData>{paymentData.transferId}</ColumnData>
          </ColumnDataContainer>
        )}

        {!!paymentData.orderId && (
          <ColumnDataContainer>
            <RowLabel>Order ID</RowLabel>
            <ColumnData>{paymentData.orderId}</ColumnData>
          </ColumnDataContainer>
        )}

        {!!paymentData.blockchainNetworkTx && (
          <ColumnDataContainer>
            <RowLabel>Blockchain Network Tx</RowLabel>
            <ColumnData>{paymentData.blockchainNetworkTx}</ColumnData>
          </ColumnDataContainer>
        )}

        <RemoveCta
          onPress={async () => {
            haptic('impactLight');
            dispatch(
              showBottomNotificationModal({
                type: 'question',
                title: 'Removing payment request data',
                message:
                  "The data of this payment request will be deleted. Make sure you don't need it",
                enableBackdropDismiss: true,
                actions: [
                  {
                    text: 'REMOVE',
                    action: () => {
                      dispatch(dismissBottomNotificationModal());
                      dispatch(
                        BuyCryptoActions.removePaymentRequestWyre({
                          orderId: paymentData.orderId,
                        }),
                      );
                      navigation.goBack();
                    },
                    primary: true,
                  },
                  {
                    text: 'GO BACK',
                    action: () => {
                      logger.debug('Removing payment Request CANCELED');
                    },
                  },
                ],
              }),
            );
          }}>
          <Text style={{color: 'red'}}>Remove</Text>
        </RemoveCta>
      </Settings>
    </SettingsContainer>
  );
};

export default WyreDetails;
