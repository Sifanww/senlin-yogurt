import { View, Text } from '@tarojs/components'
import type { ModifierGroup as ModifierGroupType } from '../../types/product'
import './index.scss'

interface Props {
  group: ModifierGroupType
  /** 当前已选的 optionId 列表 */
  selectedIds: string[]
  /** 该组是否校验通过 */
  valid?: boolean
  onToggle: (groupId: string, optionId: string) => void
}

export default function ModifierGroup({ group, selectedIds, valid = true, onToggle }: Props) {
  const { rules } = group
  const isSingle = rules.max === 1

  // 副标题：如 "必选1项" 或 "请任选3款"
  const subtitle = isSingle
    ? `必选1项`
    : rules.min === rules.max
      ? `请任选${rules.min}款`
      : `选${rules.min}~${rules.max}款`

  const progress = `${selectedIds.length}/${rules.min}`

  return (
    <View className='modifier-group'>
      <View className='modifier-group__header'>
        <View className='modifier-group__title-row'>
          <Text className='modifier-group__title'>{group.title}</Text>
          {!valid && <Text className='modifier-group__required'>未完成</Text>}
        </View>
        <View className='modifier-group__meta'>
          <Text className='modifier-group__subtitle'>{group.desc || subtitle}</Text>
          <Text className='modifier-group__progress'>{progress}</Text>
        </View>
      </View>

      <View className='modifier-group__options'>
        {group.options.map(option => {
          const isActive = selectedIds.includes(option.id)
          const isDisabled = !!option.sold_out

          const tagCls = [
            'modifier-option',
            isActive ? 'modifier-option--active' : '',
            isDisabled ? 'modifier-option--disabled' : '',
            isSingle ? 'modifier-option--radio' : 'modifier-option--check',
          ].filter(Boolean).join(' ')

          return (
            <View
              key={option.id}
              className={tagCls}
              onClick={() => !isDisabled && onToggle(group.id, option.id)}
            >
              {/* 选中指示器 */}
              <View className='modifier-option__indicator'>
                {isActive && <View className='modifier-option__dot' />}
              </View>
              <Text className='modifier-option__name'>{option.name}</Text>
              {option.price > 0 && (
                <Text className='modifier-option__price'>+¥{option.price}</Text>
              )}
              {isDisabled && <Text className='modifier-option__badge'>售罄</Text>}
            </View>
          )
        })}
      </View>
    </View>
  )
}
