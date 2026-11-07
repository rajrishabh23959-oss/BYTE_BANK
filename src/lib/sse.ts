
export interface SSEMessage {
  event: string;
  data: any;
  id?: string;
}

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  customerId?: number | null;
  role?: string;
};

declare global {

  var __bytebankSSEClients: Map<string, SSEClient> | undefined;
}

const clients: Map<string, SSEClient> = global.__bytebankSSEClients || new Map();
if (process.env.NODE_ENV !== 'production') {
  global.__bytebankSSEClients = clients;
}

export function registerSSEClient(
  id: string,
  controller: ReadableStreamDefaultController,
  customerId?: number | null,
  role?: string
) {
  clients.set(id, { id, controller, customerId, role });
}

export function unregisterSSEClient(id: string) {
  clients.delete(id);
}

export function broadcastSSE(msg: SSEMessage, filter?: (client: SSEClient) => boolean) {
  const encoder = new TextEncoder();
  const payload = `event: ${msg.event}\ndata: ${JSON.stringify(msg.data)}\n\n`;
  const bytes = encoder.encode(payload);

  for (const [id, client] of clients.entries()) {
    try {
      if (!filter || filter(client)) {
        client.controller.enqueue(bytes);
      }
    } catch (err) {
      clients.delete(id);
    }
  }
}

export function notifyCustomer(customerId: number, event: string, data: any) {
  broadcastSSE(
    { event, data },
    (client) => client.customerId === customerId || client.role === 'ADMIN'
  );
}

export function broadcastPriceTick(symbol: string, newPrice: number) {
  broadcastSSE({
    event: 'PRICE_TICK',
    data: { symbol, price: newPrice, timestamp: new Date().toISOString() },
  });
}

export function broadcastTransactionUpdate(txn: any) {
  broadcastSSE({
    event: 'TRANSACTION_UPDATE',
    data: txn,
  });
}
