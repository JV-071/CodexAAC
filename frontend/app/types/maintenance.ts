/**
 * Maintenance-related types and interfaces
 */

export interface MaintenanceStatus {
    enabled: boolean
    message?: string
    updatedAt?: string
}

export interface MaintenanceData {
    maintenance: boolean
    message?: string
}