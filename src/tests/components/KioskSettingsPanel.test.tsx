import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { KioskSettingsPanel } from '../../components/operator/KioskSettingsPanel';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn()
}));

describe('KioskSettingsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', async () => {
        const { invoke } = await import('@tauri-apps/api/core');
        vi.mocked(invoke).mockImplementation(() => new Promise(() => {}));

        render(<KioskSettingsPanel />);
        expect(screen.getByText('Cargando configuración...')).toBeTruthy();
    });
});