import { render, screen } from '@testing-library/react-native'
import { SchedulesCard } from '../../components/blocking/SchedulesCard'

describe('Dummy test for verifying setup', () => {
  it('should pass', async () => {
    render(<SchedulesCard />)
    expect(screen.getByText('+ Add Schedule')).toBeTruthy()
  })
})
