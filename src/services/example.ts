import axiosInstance from './index'

export async function getAny() {
  const { data } = await axiosInstance.get('/Any')
  return data
}
