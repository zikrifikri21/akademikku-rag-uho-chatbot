import type { Message } from '@/types'
import { useForm } from '@inertiajs/react'
import { toast } from 'sonner'

export function useMessageVoting(message: Message, chatId?: string) {
  const form = useForm({
    message_id: message.id,
    is_upvoted: message.is_upvoted,
  })

  const isUpvoted = form.data.is_upvoted === true
  const isDownvoted = form.data.is_upvoted === false
  const isProcessing = form.processing

  function voteMessage(isUpvote: boolean) {
    const action = isUpvote ? 'upvote' : 'downvote'
    const previousState = form.data.is_upvoted

    form.setData('is_upvoted', isUpvote)

    const promise = new Promise((resolve, reject) => {
      form.patch(route('chats.update', { chat: chatId }), {
        onSuccess: () => resolve({ action }),
        onError: () => {
          form.setData('is_upvoted', previousState)
          reject(new Error(`Failed to ${action}`))
        },
      })
    })

    toast.promise(promise, {
      loading: `${action === 'upvote' ? 'Upvoting' : 'Downvoting'} response...`,
      success: `Response ${action}d!`,
      error: `Failed to ${action}. Please try again`,
    })
  }

  const upvoteMessage = () => voteMessage(true)
  const downvoteMessage = () => voteMessage(false)

  return {
    isUpvoted,
    isDownvoted,
    isProcessing,
    upvoteMessage,
    downvoteMessage,
  }
}
