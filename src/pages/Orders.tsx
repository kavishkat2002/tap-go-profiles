import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { fetchProfileBySlug, fetchOrdersByProfileId, updateOrderStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Clock, CheckCircle2, ShoppingBag, XCircle } from "lucide-react";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import ProfileFooter from "@/components/ProfileFooter";

export default function Orders() {
  const { slug } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", slug],
    queryFn: () => fetchProfileBySlug(slug!),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", profile?.id],
    queryFn: () => fetchOrdersByProfileId(profile!.id),
    enabled: !!profile,
  });

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      queryClient.invalidateQueries({ queryKey: ["orders", profile?.id] });
      toast({ title: "Status updated", description: `Order is now ${status}.` });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  if (profileLoading || ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || profile.type !== "restaurant") {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <Card className="max-w-md w-full text-center p-8">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h1 className="text-xl font-bold mb-2">Unauthorized</h1>
                <p className="text-muted-foreground mb-6">This page is only available for restaurant profiles.</p>
                <Button asChild><Link to="/dashboard">Back to Dashboard</Link></Button>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-lg font-bold">{profile.name}</h1>
              <p className="text-xs text-muted-foreground tracking-tight">Order Management System</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Restaurant Mode</Badge>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-orange-500/5 border-orange-200">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                            <p className="text-2xl font-bold">{orders?.filter(o => o.status === 'pending').length || 0}</p>
                            <p className="text-[11px] font-bold uppercase text-orange-600">New Orders</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-blue-600" />
                        <div>
                            <p className="text-2xl font-bold">{orders?.filter(o => o.status === 'preparing').length || 0}</p>
                            <p className="text-[11px] font-bold uppercase text-blue-600">Preparing</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-200">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="text-2xl font-bold">{orders?.filter(o => o.status === 'completed').length || 0}</p>
                            <p className="text-[11px] font-bold uppercase text-green-600">Completed Today</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card className="shadow-sm border-none">
            <CardHeader className="border-b bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Incoming Orders</CardTitle>
                        <CardDescription>Real-time orders from your QR tables</CardDescription>
                    </div>
                    <ShoppingBag className="h-5 w-5 text-muted-foreground opacity-50" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-[100px]">Table</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders?.map((order) => (
                            <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-bold text-base">#{order.table_number}</TableCell>
                                <TableCell>
                                    <div className="max-w-[200px]">
                                        {Object.values(order.items as any).map((item: any, i) => (
                                            <div key={i} className="text-xs text-muted-foreground">
                                                <span className="font-bold text-foreground">{item.quantity}x</span> {item.item.name}
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-sm">Rs. {Number(order.total_price).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge size="sm" className={`text-[10px] uppercase font-bold tracking-tighter ${
                                        order.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                        order.status === 'preparing' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 animate-pulse' :
                                        order.status === 'pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                                        'bg-slate-100 text-slate-700 hover:bg-slate-100'
                                    }`}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Select 
                                        defaultValue={order.status} 
                                        onValueChange={(val) => handleUpdateStatus(order.id, val)}
                                    >
                                        <SelectTrigger className="h-8 w-[110px] text-xs ml-auto">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="preparing">Preparing</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                        {orders?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <ShoppingBag className="h-10 w-10 mb-2" />
                                        <p className="font-display font-bold">No orders yet</p>
                                        <p className="text-xs">Incoming orders will appear here automatically.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </main>

      <ProfileFooter />
    </div>
  );
}
