import {H4, Paragraph} from '../../../../components/styled/Text';
import React, {useEffect, useState} from 'react';
import styled from 'styled-components/native';
import {ScreenGutter} from '../../../../components/styled/Containers';
import {SlateDark, White} from '../../../../styles/colors';
import {
  Fee,
  getFeeLevelsUsingBwcClient,
  GetFeeOptions,
} from '../../../../store/wallet/effects/fee/fee';
import * as _ from 'lodash';
import {
  GetFeeUnits,
  GetTheme,
  IsERCToken,
} from '../../../../store/wallet/utils/currency';
import {
  ethAvgTime,
  FeeLevelStep,
  FeeLevelStepCircle,
  FeeLevelStepContainer,
  FeeLevelStepLine,
  FeeLevelStepBottomLabel,
  FeeLevelStepTopLabel,
  FeeLevelStepsHeader,
  FeeLevelStepsHeaderSubTitle,
} from '../../../wallet/screens/send/TransactionLevel';
import {View} from 'react-native';
import {CurrencyImage} from '../../../../components/currency-image/CurrencyImage';
import {CurrencyListIcons} from '../../../../constants/SupportedCurrencyOptions';
import {sleep} from '../../../../utils/helper-methods';
import NetworkPolicyPlaceholder from '../components/NetworkPolicyPlaceholder';
import {useAppDispatch, useAppSelector} from '../../../../utils/hooks';
import {updateCacheFeeLevel} from '../../../../store/wallet/wallet.actions';

const NetworkFeePolicyContainer = styled.SafeAreaView`
  flex: 1;
`;

const ScrollView = styled.ScrollView`
  margin-top: 20px;
  padding: 0 ${ScreenGutter};
`;

const NetworkFeePolicyParagraph = styled(Paragraph)`
  color: ${({theme: {dark}}) => (dark ? White : SlateDark)};
  margin-bottom: 15px;
`;

const StepsHeaderContainer = styled.View`
  margin: ${ScreenGutter} 0;
`;

const CurrencyImageContainer = styled.View`
  margin-right: 10px;
`;

const StepsContainer = styled.View`
  flex-direction: row;
  margin: 0 0 ${ScreenGutter} 0;
  padding: 0 3px;
`;

const BottomLabelContainer = styled.View`
  justify-content: space-between;
  flex-direction: row;
`;

const FeeOptionsContainer = styled.View`
  margin-bottom: 35px;
`;

const TopLabelContainer = styled.View`
  min-height: 30px;
`;

const FeeOptions = ({
  feeOptions,
  currencyAbbreviation,
  currencyName,
}: {
  feeOptions: any[];
  currencyAbbreviation: 'btc' | 'eth';
  currencyName: string;
}) => {
  const dispatch = useAppDispatch();
  const cachedFeeLevels = useAppSelector(({WALLET}) => WALLET.feeLevel);
  const [selectedLevel, setSelectedLevel] = useState(
    cachedFeeLevels[currencyAbbreviation],
  );

  const getSelectedFeeOption = () => {
    return feeOptions?.find(({level}) => level === selectedLevel);
  };

  const getBackgroundColor = (index?: number) => {
    const {coinColor: backgroundColor} = dispatch(
      GetTheme(currencyAbbreviation),
    );

    if (index !== undefined) {
      const selectedIndex =
        feeOptions?.findIndex(({level}) => level === selectedLevel) || 0;

      if (!(selectedIndex + 1 <= index)) {
        return backgroundColor;
      }
    }

    return '#E1E7E4';
  };

  const isFirst = (index: number): boolean => {
    return index === 0;
  };

  const isLast = (index: number, length: number): boolean => {
    return index === length - 1;
  };

  return (
    <FeeOptionsContainer>
      <StepsHeaderContainer>
        <FeeLevelStepsHeader>
          <CurrencyImageContainer>
            <CurrencyImage
              img={CurrencyListIcons[currencyAbbreviation]}
              size={20}
            />
          </CurrencyImageContainer>
          <H4>{currencyName} Network Fee Policy</H4>
        </FeeLevelStepsHeader>

        <FeeLevelStepsHeaderSubTitle>
          {`${getSelectedFeeOption()?.uiFeePerSatByte} ${
            getSelectedFeeOption()?.avgConfirmationTime
          }`}
        </FeeLevelStepsHeaderSubTitle>
      </StepsHeaderContainer>

      <StepsContainer>
        {feeOptions.map((fee, i, {length}) => (
          <FeeLevelStepContainer key={i} length={length - 1}>
            <TopLabelContainer>
              {!isFirst(i) &&
              !isLast(i, length) &&
              selectedLevel === fee.level ? (
                <View style={{flexShrink: 1}}>
                  <FeeLevelStepTopLabel length={length - 1} medium={true}>
                    {fee.uiLevel}
                  </FeeLevelStepTopLabel>
                </View>
              ) : null}
            </TopLabelContainer>

            <FeeLevelStep isLast={isLast(i, length)}>
              <FeeLevelStepCircle
                isActive={selectedLevel === fee.level}
                onPress={() => {
                  if (selectedLevel !== fee.level) {
                    setSelectedLevel(fee.level);
                    dispatch(
                      updateCacheFeeLevel({
                        currency: currencyAbbreviation,
                        feeLevel: fee.level,
                      }),
                    );
                  }
                }}
                backgroundColor={getBackgroundColor(i)}
                style={[
                  {
                    shadowColor: '#000',
                    shadowOffset: {width: -2, height: 4},
                    shadowOpacity: selectedLevel === fee.level ? 0.1 : 0,
                    shadowRadius: 5,
                    borderRadius: 12,
                    elevation: 3,
                  },
                ]}
              />

              {!isLast(i, length) ? (
                <FeeLevelStepLine backgroundColor={getBackgroundColor(i + 1)} />
              ) : null}
            </FeeLevelStep>
          </FeeLevelStepContainer>
        ))}
      </StepsContainer>

      <BottomLabelContainer>
        <FeeLevelStepBottomLabel>
          {feeOptions[0].uiLevel}
        </FeeLevelStepBottomLabel>
        <FeeLevelStepBottomLabel>
          {feeOptions[feeOptions.length - 1].uiLevel}
        </FeeLevelStepBottomLabel>
      </BottomLabelContainer>
    </FeeOptionsContainer>
  );
};

const NetworkFeePolicy = () => {
  const network = 'livenet';
  const [ethFeeOptions, setEthFeeOptions] = useState<any[]>();
  const [btcFeeOptions, setBtcFeeOptions] = useState<any[]>();
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useAppDispatch();

  const initFeeLevel = async (currencyAbbreviation: string) => {
    let feeOptions: any[] = [];
    const {feeUnit, feeUnitAmount, blockTime} = dispatch(
      GetFeeUnits(currencyAbbreviation),
    );
    try {
      const _feeLevels = await getFeeLevelsUsingBwcClient(
        currencyAbbreviation,
        network,
      );
      if (_.isEmpty(_feeLevels)) {
        return;
      }

      _feeLevels.forEach((fee: Fee) => {
        const {feePerKb, level, nbBlocks} = fee;
        const feeOption: any = {
          ...fee,
          feeUnit,
          // @ts-ignore
          uiLevel: dispatch(GetFeeOptions(currencyAbbreviation))[level],
        };
        feeOption.feePerSatByte = (feePerKb / feeUnitAmount).toFixed();
        feeOption.uiFeePerSatByte = `${feeOption.feePerSatByte} ${
          currencyAbbreviation === 'btc' ? 'Satoshis per byte' : feeUnit
        }`;

        if (
          currencyAbbreviation === 'eth' ||
          dispatch(IsERCToken(currencyAbbreviation))
        ) {
          // @ts-ignore
          feeOption.avgConfirmationTime = ethAvgTime[level];
        }

        if (currencyAbbreviation === 'btc') {
          const min = nbBlocks * blockTime;
          const hours = Math.floor(min / 60);
          feeOption.avgConfirmationTime =
            hours > 0
              ? hours === 1
                ? 'within an hour'
                : `within ${hours} hours`
              : `within ${min} minutes`;
        }
        feeOptions.push(feeOption);
      });

      feeOptions = feeOptions.reverse();

      if (currencyAbbreviation === 'btc') {
        setBtcFeeOptions(feeOptions);
      }

      if (currencyAbbreviation === 'eth') {
        setEthFeeOptions(feeOptions);
      }
    } catch (e) {
      return;
    }
  };
  const init = async () => {
    ['btc', 'eth'].forEach((ca: string) => initFeeLevel(ca));
    await sleep(500);
    setIsLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <NetworkFeePolicyContainer>
      <ScrollView>
        <NetworkFeePolicyParagraph>
          The higher the fee, the greater the incentive a miner has to include
          that transaction in a block. Current fees are determined based on
          network load and the selected policy.
        </NetworkFeePolicyParagraph>

        {isLoading ? (
          <NetworkPolicyPlaceholder />
        ) : (
          <>
            <View>
              {btcFeeOptions && btcFeeOptions.length > 0 ? (
                <FeeOptions
                  feeOptions={btcFeeOptions}
                  currencyAbbreviation={'btc'}
                  currencyName={'Bitcoin'}
                />
              ) : null}
            </View>

            <View>
              {ethFeeOptions && ethFeeOptions.length > 0 ? (
                <FeeOptions
                  feeOptions={ethFeeOptions}
                  currencyAbbreviation={'eth'}
                  currencyName={'Ethereum'}
                />
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </NetworkFeePolicyContainer>
  );
};

export default NetworkFeePolicy;
