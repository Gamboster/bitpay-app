import React, {useLayoutEffect} from 'react';
import styled from 'styled-components/native';
import {H3, Paragraph, TextAlign} from '../../../components/styled/Text';
import {
  ActionContainer,
  CtaContainer,
  HeaderRightContainer,
  ImageContainer,
  TextContainer,
  TitleContainer,
} from '../../../components/styled/Containers';
import Button from '../../../components/button/Button';
import {useNavigation} from '@react-navigation/native';
import {useAndroidBackHandler} from 'react-navigation-backhandler';
import {OnboardingImage} from '../components/Containers';
import haptic from '../../../components/haptic-feedback/haptic';

const CreateKeyContainer = styled.SafeAreaView`
  flex: 1;
  align-items: center;
`;
const KeyImage = require('../../../../assets/img/onboarding/create-wallet.png');

const CreateOrImportKey = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
      headerLeft: () => null,
      headerRight: () => (
        <HeaderRightContainer>
          <Button
            buttonType={'pill'}
            onPress={() => {
              haptic('impactLight');
              navigation.navigate('Onboarding', {
                screen: 'TermsOfUse',
                params: {
                  context: 'TOUOnly',
                },
              });
            }}>
            Skip
          </Button>
        </HeaderRightContainer>
      ),
    });
  }, [navigation]);

  useAndroidBackHandler(() => true);

  return (
    <CreateKeyContainer>
      <ImageContainer>
        <OnboardingImage style={{width: 155, height: 247}} source={KeyImage} />
      </ImageContainer>
      <TitleContainer>
        <TextAlign align={'center'}>
          <H3>Create a key or import an existing key</H3>
        </TextAlign>
      </TitleContainer>
      <TextContainer>
        <TextAlign align={'center'}>
          <Paragraph>
            Store your assets safely and securely with BitPay's non-custodial
            app. Reminder: you own your keys, so be sure to have a pen and paper
            handy to write down your 12 words.
          </Paragraph>
        </TextAlign>
      </TextContainer>
      <CtaContainer>
        <ActionContainer>
          <Button
            buttonStyle={'primary'}
            onPress={() =>
              navigation.navigate('Onboarding', {
                screen: 'CurrencySelection',
                params: {context: 'onboarding'},
              })
            }>
            Create a Key
          </Button>
        </ActionContainer>
        <ActionContainer>
          <Button
            buttonStyle={'secondary'}
            onPress={() =>
              navigation.navigate('Onboarding', {
                screen: 'Import',
                params: {context: 'onboarding'},
              })
            }>
            I already have a Key
          </Button>
        </ActionContainer>
      </CtaContainer>
    </CreateKeyContainer>
  );
};

export default CreateOrImportKey;
