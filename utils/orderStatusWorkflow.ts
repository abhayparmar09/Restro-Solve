import { OrderStatus } from '../types';

export interface OrderStatusAction {
  label: string;
  nextStatus: OrderStatus;
  buttonClass: string;
}

const STATUS_WORKFLOW: Record<OrderStatus, OrderStatusAction | null> = {
  [OrderStatus.PENDING]: {
    label: '👨‍🍳 START PREPARING',
    nextStatus: OrderStatus.PREPARING,
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  [OrderStatus.PREPARING]: {
    label: '🔔 MARK AS READY',
    nextStatus: OrderStatus.READY,
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  [OrderStatus.READY]: {
    label: '🏃 MARK AS SERVED',
    nextStatus: OrderStatus.SERVED,
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
  [OrderStatus.SERVED]: {
    label: '💰 COMPLETE BILL',
    nextStatus: OrderStatus.COMPLETED,
    buttonClass: 'bg-[#006638] hover:bg-[#00522a] text-white',
  },
  [OrderStatus.COMPLETED]: null,
  [OrderStatus.CANCELLED]: null,
};


export function getNextStatusAction(status: OrderStatus): OrderStatusAction | null {
  return STATUS_WORKFLOW[status] ?? null;
}

export function getStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING:
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case OrderStatus.PREPARING:
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case OrderStatus.READY:
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case OrderStatus.SERVED:
      return 'bg-[#006638]/10 text-[#006638] border-[#006638]/30';
    case OrderStatus.COMPLETED:
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case OrderStatus.CANCELLED:
      return 'bg-rose-100 text-rose-600 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
