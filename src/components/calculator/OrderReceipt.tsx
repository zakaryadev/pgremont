import React, { useRef } from 'react';
import { Order } from '../../types/calculator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


interface OrderReceiptProps {
  order: Order;
}

export function OrderReceipt({ order }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const formatDate = (date: Date) => {
    const orderDate = new Date(date);
    const day = orderDate.getDate().toString().padStart(2, '0');
    const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
    const year = orderDate.getFullYear();
    const hours = orderDate.getHours().toString().padStart(2, '0');
    const minutes = orderDate.getMinutes().toString().padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  /**
   * Generates a single-page PDF with a height matching the receipt content.
   * This is the recommended method for thermal printers to avoid pagination.
   */
  const downloadPDF = async () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) {
        console.error('Receipt element not found!');
        alert('Chek elementi topilmadi.');
        return;
    }

    try {
      console.log('Receipt element found:', receiptElement);
      console.log('Element dimensions:', {
        width: receiptElement.offsetWidth,
        height: receiptElement.offsetHeight,
        scrollHeight: receiptElement.scrollHeight
      });

      // Wait a bit to ensure the element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use html2canvas to capture the receipt element as an image (canvas)
      const canvas = await html2canvas(receiptElement, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#ffffff',
        width: receiptElement.offsetWidth,
        height: receiptElement.scrollHeight,
        allowTaint: true,
        logging: false, // Disable logging for cleaner output
        onclone: (clonedDoc) => {
          // Ensure the cloned document has the right styles
          const clonedElement = clonedDoc.querySelector('.receipt-container') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.fontFamily = 'Courier New, monospace';
            clonedElement.style.fontSize = '12px'; // Larger font for better quality
            clonedElement.style.lineHeight = '1.4';
            clonedElement.style.color = '#000';
            clonedElement.style.backgroundColor = '#fff';
            clonedElement.style.width = '200px'; // Wider for better text rendering
            clonedElement.style.padding = '10px';
            
            // Ensure all text elements have good contrast
            const allTextElements = clonedElement.querySelectorAll('*');
            allTextElements.forEach(el => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.color = '#000';
              htmlEl.style.fontFamily = 'Courier New, monospace';
            });
          }
        }
      });

      console.log('Canvas created:', {
        width: canvas.width,
        height: canvas.height
      });

      const imgData = canvas.toDataURL('image/png');
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Set PDF width to match 58mm thermal paper (using 48mm for margins)
      const pdfWidth = 48; 
      // Calculate the PDF height based on the captured image's aspect ratio
      const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

      console.log('PDF dimensions:', { pdfWidth, pdfHeight });

      // Create a new jsPDF instance with the dynamic page size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        // The format is [width, height], creating a single long page
        format: [pdfWidth, pdfHeight],
        compress: false, // Disable compression for better quality
      });

      // Add the captured image to the PDF with high quality settings
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const fileName = `Chek_${order.name}_${formatDate(order.createdAt).replace(/[.:\s]/g, '_')}.pdf`;
      
      console.log('Saving PDF:', fileName);
      
      // Save the generated PDF
      pdf.save(fileName);

    } catch (error) {
      console.error('Error creating PDF:', error);
      alert('PDF yaratishda xatolik yuz berdi: ' + error.message);
    }
  };

  /**
   * Uses the browser's default print function.
   * NOTE: This may still cause pagination issues depending on the browser and printer driver.
   * The @media print CSS helps, but the PDF method is more reliable.
   */
  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="print-receipt-wrapper">
      {/* --- CSS Styles for Printing and Display --- */}
      <style>{`
        /* Styles for the browser's print dialog (@media print) */
        @media print {
          /* Set page size for thermal printer */
          @page {
            size: 48mm 300mm; /* Fixed height to prevent compression */
            margin: 0;
            padding: 0;
          }
          
          /* Hide everything on the page except for the receipt */
          body * {
            visibility: hidden;
          }
          
          .print-receipt-wrapper, .receipt-container, .receipt-container * {
            visibility: visible !important;
          }
          
          .print-receipt-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            overflow: visible !important;
          }

          .receipt-container {
            width: 48mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 3mm !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 9px !important;
            line-height: 1.3 !important;
            font-family: 'Courier New', monospace !important;
            /* Prevents breaking elements across pages */
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            overflow: visible !important;
          }

          /* Ensure all sections don't break */
          .receipt-header,
          .receipt-section,
          .receipt-items,
          .receipt-item,
          .receipt-total,
          .receipt-footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }

          /* Hide the action buttons when printing */
          .no-print {
            display: none !important;
          }
        }
        
        /* --- General styles for displaying the receipt on screen --- */
        .receipt-container {
          width: 180px; /* Width for on-screen view */
          margin: 0 auto;
          background: white;
          border: 1px solid #ddd;
          padding: 6px;
          font-family: 'Courier New', monospace;
          font-size: 9px;
          line-height: 1.3;
        }
        
        .receipt-header {
          text-align: center;
          border-bottom: 1px dashed #333;
          padding-bottom: 4px;
          margin-bottom: 6px;
        }

        .receipt-logo-img {
          height: 30px;
          width: auto;
          margin: 0 auto 3px;
        }
        
        .receipt-subtitle {
          font-size: 8px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .receipt-section {
          margin-bottom: 5px;
        }
        
        .receipt-section-title {
          font-weight: bold;
          border-bottom: 1px solid #333;
          padding-bottom: 2px;
          margin-bottom: 4px;
          font-size: 10px;
        }
        
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 8px;
        }
        
        .receipt-row-label {
          word-wrap: break-word;
        }
        
        .receipt-row-value {
          text-align: right;
          font-weight: bold;
        }
        
        .receipt-items {
          margin-bottom: 3px;
        }
        
        .receipt-item {
          margin-bottom: 3px;
          padding: 2px 0;
          border-bottom: 1px dotted #ccc;
        }
        
        .receipt-item:last-child {
          border-bottom: none;
        }
        
        .receipt-total {
          border-top: 2px solid #333;
          padding-top: 5px;
          margin-top: 8px;
          font-weight: bold;
          font-size: 10px;
        }
        
        .receipt-footer {
          text-align: center;
          margin-top: 6px;
          padding-top: 3px;
          border-top: 1px dashed #333;
          font-size: 8px;
          color: #666;
        }
      `}</style>

      {/* --- Receipt Content --- */}
      <div 
        ref={receiptRef} 
        className="receipt-container"
        style={{
          fontFamily: 'Courier New, monospace',
          fontSize: '10px',
          lineHeight: '1.4',
          color: '#000',
          backgroundColor: '#fff',
          width: '200px',
          margin: '0 auto',
          fontWeight: 'normal'
        }}
      >
        <div className="receipt-header">
          <div className="receipt-logo">
            <img
              src="/logo_chek.png"
              alt="PG Remont Logo"
              className="receipt-logo-img"
            />
          </div>
          <div className="receipt-subtitle">Professional Poligrafiya</div>
          <div className="receipt-subtitle">Chek № {order.id.slice(-8)}</div>
        </div>

        <div className="receipt-section">
          <div className="receipt-section-title">BUYURTMA</div>
          <div className="receipt-row">
            <span className="receipt-row-label">{order.name}</span>
          </div>
          {order.phone && (
            <div className="receipt-row">
              <span className="receipt-row-label">Tel: {order.phone}</span>
            </div>
          )}
          <div className="receipt-row">
            <span className="receipt-row-label">{formatDate(order.createdAt)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-row-label">Mat: {order.materials[order.state.selectedMaterial]?.name || 'Tanlanmagan'}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-row-label">Narx: {formatCurrency(order.materials[order.state.selectedMaterial]?.price || 0)}/m²</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-row-label">Xiz: {order.services[order.state.selectedService]?.name || 'Xizmat yo\'q'}</span>
          </div>
        </div>

        <div className="receipt-section">
          <div className="receipt-section-title">MAHSULOTLAR</div>
          <div className="receipt-items">
            {order.state.items.map((item, index) => {
              const isBadge = item.name.toLowerCase().includes('beydjik');
              const isAcrylicLetters = item.name.toLowerCase().includes('akril');
              
              if (isBadge) {
                return (
                  <div key={item.id} className="receipt-item">
                    <div className="receipt-row"><span className="receipt-row-label" style={{ fontWeight: 'bold' }}>{index + 1}. {item.name}</span></div>
                    <div className="receipt-row"><span className="receipt-row-label">7×4 cm</span></div>
                    <div className="receipt-row"><span className="receipt-row-label">Soni: {item.quantity}</span></div>
                    <div className="receipt-row"><span className="receipt-row-label">Narx: {formatCurrency(item.materialPrice)}</span></div>
                    <div className="receipt-row"><span className="receipt-row-label" style={{ fontWeight: 'bold' }}>Jami: {formatCurrency(item.quantity * item.materialPrice)}</span></div>
                  </div>
                );
              }

              if (isAcrylicLetters) {
                return (
                  <div key={item.id} className="receipt-item">
                    <div className="receipt-row"><span className="receipt-row-label" style={{ fontWeight: 'bold' }}>{index + 1}. {item.name}</span></div>
                    <div className="receipt-row"><span className="receipt-row-label">Baland: {item.height} cm</span></div>
                    <div className="receipt-row"><span className="receipt-row-label">Soni: {item.quantity}</span></div>
                    <div className="receipt-row"><span className="receipt-row-label">1 cm: {formatCurrency(item.materialPrice)}</span></div>
                    <div className="receipt-row"><span className="receipt-row-label" style={{ fontWeight: 'bold' }}>Jami: {formatCurrency(item.height * item.quantity * item.materialPrice)}</span></div>
                  </div>
                );
              }
              
              return (
                <div key={item.id} className="receipt-item">
                  <div className="receipt-row"><span className="receipt-row-label">{index + 1}. {item.name}</span></div>
                  <div className="receipt-row"><span className="receipt-row-label">{item.width}×{item.height} m</span></div>
                  <div className="receipt-row"><span className="receipt-row-label">Soni: {item.quantity}</span></div>
                  <div className="receipt-row"><span className="receipt-row-label">Maydon: {(item.width * item.height * item.quantity).toFixed(2)} m²</span></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="receipt-section">
          <div className="receipt-section-title">HISOB</div>
          <div className="receipt-row"><span className="receipt-row-label">Pechat:</span><span className="receipt-row-value">{order.results.totalPrintArea.toFixed(2)}m²</span></div>
          <div className="receipt-row"><span className="receipt-row-label">Material:</span><span className="receipt-row-value">{order.results.totalMaterialUsed.toFixed(2)}m²</span></div>
          <div className="receipt-row"><span className="receipt-row-label">Chiqindi:</span><span className="receipt-row-value">{order.results.totalWaste.toFixed(2)}m²</span></div>
          <div className="receipt-row"><span className="receipt-row-label">Xizmat:</span><span className="receipt-row-value">{formatCurrency(order.results.serviceCost)}</span></div>
        </div>

        <div className="receipt-total">
          <div className="receipt-row"><span className="receipt-row-label">Jami:</span><span className="receipt-row-value">{formatCurrency(order.results.totalCost)}</span></div>
          {order.results.discountAmount > 0 && (
            <div className="receipt-row">
              <span className="receipt-row-label">Skidka ({order.state.discountPercentage}%):</span>
              <span className="receipt-row-value" style={{ color: '#16a34a' }}>-{formatCurrency(order.results.discountAmount)}</span>
            </div>
          )}
          <div className="receipt-row" style={{ borderTop: '2px solid #000', paddingTop: '4px', marginTop: '4px' }}>
            <span className="receipt-row-label" style={{ fontWeight: 'bold', fontSize: '10px' }}>YAKUNIY:</span>
            <span className="receipt-row-value" style={{ fontWeight: 'bold', fontSize: '10px' }}>{formatCurrency(order.results.finalCost)}</span>
          </div>
        </div>

        <div className="receipt-footer">
          <h3>
            Reklama bor joyda — baraka bor!<br />
            +(77) 300-45-00
          </h3>
        </div>
      </div>

      {/* --- Action Buttons (Not visible when printing) --- */}
      <div className="no-print" style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={downloadPDF} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
            📄 PDF yuklash
          </button>
          <button onClick={printReceipt} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
            🖨️ Chop etish
          </button>
        </div>
      </div>
    </div>
  );
}

