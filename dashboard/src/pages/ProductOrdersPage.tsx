import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { ProductOrder, ProductOrderStats } from '../types';
import api from '../services/api';

const ProductOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [stats, setStats] = useState<ProductOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') {
        params.paymentStatus = filterStatus;
      }
      
      const response = await api.get('/product-orders', { params });
      setOrders(response.data.data.orders);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/product-orders/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: 'pending' | 'paid') => {
    try {
      await api.patch(`/product-orders/${orderId}/payment-status`, {
        paymentStatus: status
      });
      
      fetchOrders();
      fetchStats();
      setDetailsOpen(false);
      setSelectedOrder(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el estado');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta orden?')) {
      return;
    }

    try {
      await api.delete(`/product-orders/${orderId}`);
      fetchOrders();
      fetchStats();
      setDetailsOpen(false);
      setSelectedOrder(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la orden');
    }
  };

  const handleViewDetails = (order: ProductOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    return status === 'paid' ? 'success' : 'warning';
  };

  const getStatusLabel = (status: string) => {
    return status === 'paid' ? 'Pagado' : 'Pendiente';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Órdenes de Productos
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchOrders();
            fetchStats();
          }}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Órdenes
                </Typography>
                <Typography variant="h4">
                  {stats.totalOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pendientes
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pagadas
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.paidOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Ingresos Totales
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(stats.totalRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Box mb={2}>
        <TextField
          select
          label="Filtrar por estado"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Todas</MenuItem>
          <MenuItem value="pending">Pendientes</MenuItem>
          <MenuItem value="paid">Pagadas</MenuItem>
        </TextField>
      </Box>

      {/* Tabla de órdenes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="center">Cantidad</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary" py={3}>
                    No hay órdenes registradas
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {order.customerName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {order.customerEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.productName || 'Producto eliminado'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{order.quantity}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(order.totalPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(order.paymentStatus)}
                      color={getStatusColor(order.paymentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(order)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {order.paymentStatus === 'pending' && (
                      <Tooltip title="Marcar como pagado">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleUpdatePaymentStatus(order.id, 'paid')}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {order.paymentStatus === 'paid' && (
                      <Tooltip title="Marcar como pendiente">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleUpdatePaymentStatus(order.id, 'pending')}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de detalles */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalles de la Orden</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Producto
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.productName || 'Producto eliminado'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1">{selectedOrder.customerName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedOrder.customerEmail}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedOrder.customerPhone}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Dirección de Envío
                  </Typography>
                  <Typography variant="body1">{selectedOrder.customerAddress}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Cantidad
                  </Typography>
                  <Typography variant="body1">{selectedOrder.quantity}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Precio Unitario
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedOrder.unitPrice)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(selectedOrder.totalPrice)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Estado
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedOrder.paymentStatus)}
                    color={getStatusColor(selectedOrder.paymentStatus)}
                    size="small"
                  />
                </Grid>

                {selectedOrder.paymentLink && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Link de Pago
                    </Typography>
                    <Typography
                      variant="body2"
                      component="a"
                      href={selectedOrder.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: 'primary.main', wordBreak: 'break-all' }}
                    >
                      {selectedOrder.paymentLink}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Orden
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedOrder.createdAt)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Cerrar
          </Button>
          {selectedOrder && selectedOrder.paymentStatus === 'pending' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'paid')}
            >
              Marcar como Pagado
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductOrdersPage;
