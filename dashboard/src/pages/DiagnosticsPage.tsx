import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Alert,
    List,
    ListItem,
    ListItemText,
    Chip,
    CircularProgress,
} from '@mui/material'
import { testConnection } from '@/utils/testConnection'

interface TestResult {
    name: string
    status: 'success' | 'error' | 'pending'
    message: string
    details?: any
}

export default function DiagnosticsPage() {
    const [tests, setTests] = useState<TestResult[]>([])
    const [running, setRunning] = useState(false)

    const runDiagnostics = async () => {
        setRunning(true)
        setTests([])

        const addTest = (test: TestResult) => {
            setTests(prev => [...prev, test])
        }

        // Test 1: Environment variables
        addTest({
            name: 'Environment Variables',
            status: 'pending',
            message: 'Checking environment configuration...'
        })

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        addTest({
            name: 'Environment Variables',
            status: 'success',
            message: `API URL: ${apiUrl}`,
            details: {
                VITE_API_URL: import.meta.env.VITE_API_URL,
                VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV,
                MODE: import.meta.env.MODE,
                DEV: import.meta.env.DEV
            }
        })

        // Test 2: Network connectivity
        addTest({
            name: 'Network Connectivity',
            status: 'pending',
            message: 'Testing network connectivity...'
        })

        try {
            const result = await testConnection()

            if (result.success) {
                addTest({
                    name: 'Network Connectivity',
                    status: 'success',
                    message: 'All network tests passed',
                    details: result
                })
            } else {
                addTest({
                    name: 'Network Connectivity',
                    status: 'error',
                    message: result.error || 'Network test failed',
                    details: result
                })
            }
        } catch (error: any) {
            addTest({
                name: 'Network Connectivity',
                status: 'error',
                message: error.message || 'Network test failed',
                details: error
            })
        }

        // Test 3: Local storage
        addTest({
            name: 'Local Storage',
            status: 'pending',
            message: 'Checking local storage...'
        })

        try {
            const token = localStorage.getItem('token')
            addTest({
                name: 'Local Storage',
                status: 'success',
                message: token ? 'Token found in storage' : 'No token in storage',
                details: {
                    hasToken: !!token,
                    tokenLength: token?.length || 0
                }
            })
        } catch (error: any) {
            addTest({
                name: 'Local Storage',
                status: 'error',
                message: 'Local storage access failed',
                details: error
            })
        }

        // Test 4: Browser capabilities
        addTest({
            name: 'Browser Capabilities',
            status: 'success',
            message: 'Browser capabilities checked',
            details: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                platform: navigator.platform
            }
        })

        setRunning(false)
    }

    useEffect(() => {
        runDiagnostics()
    }, [])

    const getStatusColor = (status: TestResult['status']) => {
        switch (status) {
            case 'success': return 'success'
            case 'error': return 'error'
            case 'pending': return 'warning'
            default: return 'default'
        }
    }

    const getStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'success': return '✅'
            case 'error': return '❌'
            case 'pending': return '⏳'
            default: return '❓'
        }
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Diagnósticos del Sistema
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                Esta página ayuda a diagnosticar problemas de conectividad y configuración.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                    variant="contained"
                    onClick={runDiagnostics}
                    disabled={running}
                    startIcon={running ? <CircularProgress size={20} /> : undefined}
                >
                    {running ? 'Ejecutando...' : 'Ejecutar Diagnósticos'}
                </Button>
            </Box>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Resultados de las Pruebas
                    </Typography>

                    <List>
                        {tests.map((test, index) => (
                            <ListItem key={index} divider>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span>{getStatusIcon(test.status)}</span>
                                            <Typography variant="subtitle1">
                                                {test.name}
                                            </Typography>
                                            <Chip
                                                label={test.status}
                                                color={getStatusColor(test.status)}
                                                size="small"
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {test.message}
                                            </Typography>
                                            {test.details && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" component="pre" sx={{
                                                        backgroundColor: 'grey.100',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        display: 'block',
                                                        whiteSpace: 'pre-wrap',
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {JSON.stringify(test.details, null, 2)}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>

                    {tests.length === 0 && !running && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                            Haz clic en "Ejecutar Diagnósticos" para comenzar las pruebas
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    )
}