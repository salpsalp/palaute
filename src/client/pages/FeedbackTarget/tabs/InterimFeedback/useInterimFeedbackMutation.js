import { useMutation } from 'react-query'
import { endOfDay, startOfDay } from 'date-fns'

import queryClient from '../../../../util/queryClient'
import apiClient from '../../../../util/apiClient'

export const useCreateInterimFeedbackMutation = parentId => {
  const mutationFn = async ({ name, startDate, endDate }) => {
    const { data } = await apiClient.post(`/feedback-targets/${parentId}/interimFeedbacks`, {
      name,
      startDate: startDate ? startOfDay(new Date(startDate)) : null,
      endDate: endDate ? endOfDay(new Date(endDate)) : null,
    })

    return data
  }

  const mutation = useMutation(mutationFn, {
    onSuccess: () => {
      queryClient.invalidateQueries(['interimFeedbacks', parentId])
    },
  })

  return mutation
}
