import { Separator } from "@/components/ui/separator";
import Image from "next/image"

export function CheckoutSummary({ items }) {
    // calculate totals

    const Subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div key={item.id} className="flex items-start py-4">
                        <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                            <Image src={item.image || "./placeholder.svg"} alt={item.name} fill className="object-cover" />
                            </div>

                            <div className="ml-4 flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                </div>

                            <div className="text-right">
                                <p className="font-medium">{(item.price * item.quantity).toFixed(2)} PYUSD</p>
                                <p className="text-sm text-muted-foreground">{item.price.toFixed(2)} PYUSD each</p>
                                </div>
                    </div>
            ))}
            <Separator />
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{Subtotal.toFixed(2)} PYUSD</span>
                </div>
                <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>Free</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>0.00 PYUSD</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{Subtotal.toFixed(2)} PYUSD</span>
                </div>
            </div>
        </div>
    )
}