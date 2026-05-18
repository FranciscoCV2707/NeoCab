import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { PluginsPanel } from '../../components/operator/PluginsPanel';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn()
}));

describe('PluginsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation(() => new Promise(() => {}));

        render(<PluginsPanel />);
        expect(screen.getByText('Cargando plugins...')).toBeTruthy();
    });
});