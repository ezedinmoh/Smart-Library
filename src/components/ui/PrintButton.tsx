"use client";

export default function PrintButton({
    className = "btn btn-secondary",
    children = "Print Receipt",
}: {
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <button id="print-receipt-button" name="print-receipt-button" type="button" onClick={() => window.print()} className={className}>
            {children}
        </button>
    );
}
