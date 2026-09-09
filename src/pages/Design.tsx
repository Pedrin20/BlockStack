import { useAuth } from '../hooks/useAuth'
import { ThemeStudio } from '../components/design/ThemeStudio'
import { PageLoading } from '../components/ui'

export function Design() {
  const { user } = useAuth()

  if (!user) {
    return <PageLoading />
  }

  return <ThemeStudio />
}
