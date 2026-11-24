import type { LinearClient } from '@linear/sdk'
import { afterEach, expect, it, vi } from 'vitest'

import { listIssues } from './listIssues'

afterEach(() => vi.restoreAllMocks())

it('finds active assignments beyond the first page of closed issues, independent of team status names', async () => {
	const statuses = [
		...Array.from({ length: 50 }, () => ({ type: 'completed', name: 'Shipped' })),
		{ type: 'canceled', name: 'Dropped' },
		{ type: 'duplicate', name: 'Duplicate' },
		{ type: 'started', name: 'Almost done' },
	]
	const issues = statuses.map((state, i) => ({ identifier: `ENG-${i + 1}`, title: state.name, state }))
	const viewer = {
		async assignedIssues({ first, filter }: { first: number; filter?: { state: { type: { nin: string[] } } } }) {
			const matching = issues.filter((issue) => !filter?.state.type.nin.includes(issue.state.type))
			return { nodes: matching.slice(0, first), pageInfo: { hasNextPage: matching.length > first } }
		},
	}
	const output = vi.spyOn(console, 'log').mockImplementation(() => {})

	await listIssues({ viewer } as unknown as LinearClient)

	const report = output.mock.calls.flat().join('\n')
	expect(report).toContain('ENG-53')
	expect(report).not.toMatch(/Shipped|Dropped|Duplicate|There may be more/)
})
