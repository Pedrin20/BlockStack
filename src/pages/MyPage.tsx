import { useAuth } from '../hooks/useAuth'
import { PageBuilder } from '../components/builder/PageBuilder'
import { PageLoading } from '../components/ui'

export function MyPage() {
  const { user } = useAuth()

  if (!user) {
    return <PageLoading />
  }

  return <PageBuilder userId={user.uid} />
}
