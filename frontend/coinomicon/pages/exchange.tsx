import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Exchange() {
  const router = useRouter()

  useEffect(() => {
    router.push('/exchange/search')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <></>
}
