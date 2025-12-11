import { render, screen } from '@testing-library/react-native'
import { WeeklySchedulesEditor } from './WeeklySchedulesEditor'

describe('WeeklySchedulesEditor', () => {
  it('should pass (verify setup)', async () => {
    render(<WeeklySchedulesEditor />)
    expect(screen.getByText('+ Add Schedule')).toBeTruthy()
  })
})
