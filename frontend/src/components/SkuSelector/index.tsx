import { View, Text } from '@tarojs/components'
import type { Sku } from '../../types/product'
import './index.scss'

interface Props {
  skus: Sku[]
  selectedId?: string
  onSelect: (skuId: string) => void
}

export default function SkuSelector({ skus, selectedId, onSelect }: Props) {
  return (
    <View className='sku-selector'>
      <Text className='sku-selector__title'>选择规格</Text>
      <View className='sku-selector__tags'>
        {skus.map(sku => {
          const isActive = sku.id === selectedId
          const isDisabled = !!sku.sold_out
          const cls = [
            'sku-tag',
            isActive ? 'sku-tag--active' : '',
            isDisabled ? 'sku-tag--disabled' : '',
          ].filter(Boolean).join(' ')

          return (
            <View
              key={sku.id}
              className={cls}
              onClick={() => !isDisabled && onSelect(sku.id)}
            >
              <Text className='sku-tag__name'>{sku.name}</Text>
              <Text className='sku-tag__price'>¥{sku.price}</Text>
              {isDisabled && <Text className='sku-tag__badge'>售罄</Text>}
            </View>
          )
        })}
      </View>
    </View>
  )
}
