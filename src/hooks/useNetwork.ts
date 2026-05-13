import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface CabinetInfo {
    id: string;
    name: string;
    ip: string;
    port: number;
    is_master: boolean;
    last_seen: number;
}

export type NetworkRole = 'Standalone' | 'Master' | 'Client';

export function useNetwork() {
    const [discoveredCabinets, setDiscoveredCabinets] = useState<CabinetInfo[]>([]);
    const [role, setRole] = useState<NetworkRole>('Standalone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCabinets = useCallback(async () => {
        try {
            const cabinets = await invoke<CabinetInfo[]>('list_discovered_cabinets');
            setDiscoveredCabinets(cabinets);
        } catch (err) {
            console.error('Failed to list cabinets:', err);
        }
    }, []);

    const loadRole = useCallback(async () => {
        try {
            const currentRole = await invoke<NetworkRole>('get_network_role');
            setRole(currentRole);
        } catch (err) {
            console.error('Failed to get network role:', err);
        }
    }, []);

    const changeRole = async (newRole: NetworkRole) => {
        setLoading(true);
        try {
            await invoke('set_network_role', { role: newRole });
            setRole(newRole);
        } catch (err) {
            setError(err as string);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRole();
        loadCabinets();
        const interval = setInterval(loadCabinets, 5000);
        return () => clearInterval(interval);
    }, [loadRole, loadCabinets]);

    return {
        discoveredCabinets,
        role,
        loading,
        error,
        changeRole,
        refresh: loadCabinets,
    };
}
