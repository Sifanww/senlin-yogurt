import { View, Text } from '@tarojs/components'
import type { PriceBreakdown } from '../../types/product'
import './index.scss'

interface Props {
  price: PriceBreakdown
  isValid: boolean
  onAddToCart: () => void
}

export default function ActionFooter({ price, isValid, onAddToCart }: Props) {
  return (
    <View className='action-footer'>
      <View className='action-footer__price'>
        <Text className='action-footer__label'>合计</Text>
        <View className='action-footer__amount'>
          <Text className='action-footer__symbol'>¥</Text>
          <Text className='action-footer__value'>{price.total}</Text>
        </View>
        {price.modifiers_total > 0 && (
          <Text className='action-footer__extra'>
            (含加料 ¥{price.modifiers_total})
          </Text>
        )}
      </View>
      <View
        className={`action-footer__btn ${!isValid ? 'action-footer__btn--disabled' : ''}`}
        onClick={() => isValid && onAddToCart()}
      >
        加入购物车
      </View>
    </View>
  )
}
