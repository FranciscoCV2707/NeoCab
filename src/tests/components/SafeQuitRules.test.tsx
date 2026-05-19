import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SafeQuitRulesPanel } from '../../components/operator/SafeQuitRules';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn()
}));

describe('SafeQuitRulesPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation(() => new Promise(() => {}));

        render(<SafeQuitRulesPanel />);
        expect(screen.getByText('Cargando reglas...')).toBeTruthy();
    });
});