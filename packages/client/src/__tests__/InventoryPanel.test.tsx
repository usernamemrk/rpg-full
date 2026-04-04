import { render, screen, waitFor } from '@testing-library/react'
import InventoryPanel from '../components/game/InventoryPanel'

const mockItems = [
  { id: 'inv1', quantity: 2, item: { id: 'i1', name: 'Espada Longa', type: 'weapon', rarity: 'rare', stats: {} } },
  { id: 'inv2', quantity: 1, item: { id: 'i2', name: 'Poção', type: 'consumable', rarity: 'common', stats: {} } },
]

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockItems,
  }) as any
})

afterEach(() => { vi.restoreAllMocks() })

it('renders nothing when closed', () => {
  const { container } = render(
    <InventoryPanel characterId="c1" token="tok" open={false} onClose={vi.fn()} />
  )
  expect(container.firstChild).toBeNull()
})

it('renders item names when open', async () => {
  render(<InventoryPanel characterId="c1" token="tok" open={true} onClose={vi.fn()} />)
  await waitFor(() => {
    expect(screen.getByText('Espada Longa')).toBeTruthy()
    expect(screen.getByText('Poção')).toBeTruthy()
  })
})

it('shows empty state when no items', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) as any
  render(<InventoryPanel characterId="c1" token="tok" open={true} onClose={vi.fn()} />)
  await waitFor(() => {
    expect(screen.getByText(/nenhum item/i)).toBeTruthy()
  })
})

it('calls onClose when close button clicked', async () => {
  const onClose = vi.fn()
  render(<InventoryPanel characterId="c1" token="tok" open={true} onClose={onClose} />)
  await waitFor(() => screen.getByText('Espada Longa'))
  screen.getByRole('button', { name: '×' }).click()
  expect(onClose).toHaveBeenCalled()
})
