import React, {useCallback} from 'react';
import styled, {useTheme} from 'styled-components/native';
import Button from '../../../components/button/Button';
import CardComponent from '../../../components/card/Card';
import ProgressBar from '../../../components/progress-bar/ProgressBar';
import {BaseText, H3} from '../../../components/styled/Text';
import {Card} from '../../../store/card/card.models';
import {Action, Slate, SlateDark, White} from '../../../styles/colors';
import ShippingStatusCardIcon from './ShippingStatusCardIcon';

interface ShippingStatusProps {
  card: Card;
  onActivatePress?: (card: Card) => any;
}

const StyledHeading = styled(H3)`
  color: ${({theme}) => (theme.dark ? White : SlateDark)};
`;

const Description = styled(BaseText)`
  color: ${Slate};
  font-size: 14px;
  margin-bottom: 12px;
  margin-top: 12px;
`;

const ButtonText = styled(BaseText)`
  color: ${({theme}) => (theme.dark ? White : Action)};
  font-weight: 500;
`;

const ShippingStatus: React.FC<ShippingStatusProps> = props => {
  const {card, onActivatePress} = props;
  const theme = useTheme();

  const renderShippingIcon = useCallback(() => {
    return card.brand ? <ShippingStatusCardIcon brand={card.brand} /> : null;
  }, [card.brand]);

  const header = <StyledHeading>Ordered</StyledHeading>;

  const body = (
    <>
      <ProgressBar progress={50} renderIcon={renderShippingIcon} />

      <Description>
        Your card has been shipped and is on its way to you. If you don't
        receive it within 10 business days, please call 1-855-398-1373 Monday
        through Sunday from 10AM to 10PM EST.
      </Description>
    </>
  );

  const footer = (
    <Button buttonStyle="secondary" onPress={() => onActivatePress?.(card)}>
      <ButtonText>Activate Physical Card</ButtonText>
    </Button>
  );

  return (
    <CardComponent
      style={{
        height: 'auto',
        width: '100%',
        backgroundColor: theme.dark ? '#1d1d1d' : White,
      }}
      header={header}
      body={body}
      footer={footer}
    />
  );
};

export default ShippingStatus;
