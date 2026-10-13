import React, { useState } from 'react';
import { Customer, ImportRow, ImportSummary } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Users, 
  Check, 
  Info,
  ShieldAlert,
  FileText
} from 'lucide-react';

interface DataImportViewProps {
  onImportComplete?: () => void;
  onNavigateCustomers?: () => void;
}

export const DataImportView: React.FC<DataImportViewProps> = ({
  onImportComplete,
  onNavigateCustomers,
}) => {
  const { success, error, warning, info } = useToast();

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'summary'>('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  // Column mappings
  const [mapping, setMapping] = useState<{
    name: string;
    mobile: string;
    customerId: string;
    hostelName: string;
    roomNumber: string;
    packageName: string;
    totalWashes: string;
    usedWashes: string;
    startDate: string;
    endDate: string;
  }>({
    name: '',
    mobile: '',
    customerId: '',
    hostelName: '',
    roomNumber: '',
    packageName: '',
    totalWashes: '',
    usedWashes: '',
    startDate: '',
    endDate: '',
  });

  // Duplicate strategy
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');

  // Preview rows
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // Parse quoted CSV/TSV records, including escaped quotes and embedded newlines.
  const parseCSV = (text: string) => {
    const normalizedText = text.replace(/^\uFEFF/, '');
    const firstLine = normalizedText.split(/\r?\n/, 1)[0] || '';
    const delimiter = firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ',';
    const parsedRows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let insideQuote = false;

    for (let i = 0; i < normalizedText.length; i++) {
      const char = normalizedText[i];

      if (char === '"' && (insideQuote || cell.length === 0)) {
        if (insideQuote && normalizedText[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === delimiter && !insideQuote) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\n' || char === '\r') && !insideQuote) {
        if (char === '\r' && normalizedText[i + 1] === '\n') i++;
        row.push(cell.trim());
        if (row.some(value => value.length > 0)) parsedRows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    if (insideQuote) {
      throw new Error('CSV contains an unclosed quoted field.');
    }

    row.push(cell.trim());
    if (row.some(value => value.length > 0)) parsedRows.push(row);
    if (parsedRows.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row.');
    }

    return { headers: parsedRows[0], rows: parsedRows.slice(1) };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        setFileContent(text);
        const { headers: h, rows: r } = parseCSV(text);
        setHeaders(h);
        setRawRows(r);

        // Auto-detect mappings
        const autoMap = {
          name: h.find(c => /^(student\s*name|name|student|full\s*name)$/i.test(c)) || '',
          mobile: h.find(c => /^(mobile|mobile\s*number|phone|contact)$/i.test(c)) || '',
          customerId: h.find(c => /^(customer\s*id|id|student\s*id)$/i.test(c)) || '',
          hostelName: h.find(c => /^(hostel|hostel\s*name|residence|building)$/i.test(c)) || '',
          roomNumber: h.find(c => /^(room|room\s*number|room\s*no)$/i.test(c)) || '',
          packageName: h.find(c => /^(package|package\s*name|plan)$/i.test(c)) || '',
          totalWashes: h.find(c => /^(total\s*washes|wash\s*limit|quota)$/i.test(c)) || '',
          usedWashes: h.find(c => /^(used\s*washes|washes\s*used)$/i.test(c)) || '',
          startDate: h.find(c => /^(start\s*date|package\s*start)$/i.test(c)) || '',
          endDate: h.find(c => /^(end\s*date|package\s*end)$/i.test(c)) || '',
        };

        setMapping(autoMap);
        setStep('mapping');
        success('File Loaded', `Detected ${h.length} columns and ${r.length} rows.`);
      } catch (err: any) {
        error('CSV Parse Error', err.message || 'Unable to parse file.');
      }
    };
    reader.readAsText(file);
  };

  // Generate preview with validations and duplicate detection
  const handleProceedToPreview = () => {
    if (!mapping.name) {
      error('Mapping Error', 'Please map the Student Name column.');
      return;
    }
    if (!mapping.mobile) {
      error('Mapping Error', 'Please map the Mobile Number column.');
      return;
    }

    const existingCustomers = dataService.getCustomers();
    const rows: ImportRow[] = [];
    const seenCustomerIds = new Set(existingCustomers.map(c => c.customer_id.toUpperCase()));
    const seenMobiles = new Set(existingCustomers.map(c => c.mobile.replace(/[^0-9]/g, '')));

    const getVal = (row: string[], colName: string) => {
      const idx = headers.indexOf(colName);
      return idx >= 0 && idx < row.length ? row[idx].trim() : '';
    };

    rawRows.forEach((raw, i) => {
      const rowNum = i + 1;
      const sName = getVal(raw, mapping.name);
      const sMobile = getVal(raw, mapping.mobile);
      const sCustId = mapping.customerId ? getVal(raw, mapping.customerId) : '';
      const sHostel = mapping.hostelName ? getVal(raw, mapping.hostelName) : 'Ganga Hostel';
      const sRoom = mapping.roomNumber ? getVal(raw, mapping.roomNumber) : '';
      const sPackage = mapping.packageName ? getVal(raw, mapping.packageName) : 'PREMIUM';
      const sTotalWashes = mapping.totalWashes ? Number(getVal(raw, mapping.totalWashes)) : 34;
      const sUsedWashes = mapping.usedWashes ? Number(getVal(raw, mapping.usedWashes)) : 0;
      const sStartDate = mapping.startDate ? getVal(raw, mapping.startDate) : '';
      const sEndDate = mapping.endDate ? getVal(raw, mapping.endDate) : '';

      const errorsList: string[] = [];
      const warningsList: string[] = [];

      // Validation
      if (!sName) {
        errorsList.push('Student Name is empty.');
      }

      const cleanMobile = sMobile.replace(/[^0-9]/g, '');
      if (!cleanMobile || cleanMobile.length < 10) {
        errorsList.push(`Invalid mobile "${sMobile}". Must have at least 10 digits.`);
      }

      if (!sRoom) {
        warningsList.push('Room number is not supplied (will remain blank).');
      }

      if (!Number.isInteger(sTotalWashes) || sTotalWashes < 1) {
        errorsList.push('Yearly wash limit must be a positive whole number.');
      }
      if (!Number.isInteger(sUsedWashes) || sUsedWashes < 0) {
        errorsList.push('Used washes must be a non-negative whole number.');
      }
      if (sUsedWashes > sTotalWashes) {
        errorsList.push(`Used washes (${sUsedWashes}) exceeds total washes (${sTotalWashes}).`);
      }

      const normalizedCustomerId = sCustId.toUpperCase();
      const isDuplicate =
        (normalizedCustomerId.length > 0 && seenCustomerIds.has(normalizedCustomerId)) ||
        (cleanMobile.length >= 10 && seenMobiles.has(cleanMobile));

      if (isDuplicate) {
        warningsList.push(
          `Matches an existing customer or an earlier row in this file (${sCustId || sMobile}). Will be handled per duplicate strategy.`
        );
      }

      if (errorsList.length === 0) {
        if (normalizedCustomerId) seenCustomerIds.add(normalizedCustomerId);
        seenMobiles.add(cleanMobile);
      }

      rows.push({
        rowNumber: rowNum,
        data: {
          name: sName,
          mobile: sMobile,
          customer_id: sCustId,
          hostel_name: sHostel,
          room_number: sRoom,
          package_name: sPackage,
          total_washes: isNaN(sTotalWashes) ? 34 : sTotalWashes,
          used_washes: isNaN(sUsedWashes) ? 0 : sUsedWashes,
          package_start_date: sStartDate,
          package_end_date: sEndDate,
        },
        errors: errorsList,
        warnings: warningsList,
        isDuplicate,
        isValid: errorsList.length === 0,
      });
    });

    setParsedRows(rows);
    setStep('preview');
  };

  const handleExecuteImport = () => {
    const validRecords = parsedRows
      .filter(r => r.isValid)
      .map(r => r.data as Partial<Customer>);

    try {
      const summary = dataService.bulkImportCustomers(validRecords, {
        duplicateStrategy,
      });

      // Add pre-filtering error counts
      const preErrors = parsedRows.filter(r => !r.isValid);
      preErrors.forEach(pe => {
        summary.errors.push({
          row: pe.rowNumber,
          reason: pe.errors.join(', '),
        });
        summary.errorCount++;
      });

      setImportSummary(summary);
      setStep('summary');

      if (onImportComplete) {
        onImportComplete();
      }

      success(
        'Data Import Executed!',
        `${summary.importedCount} customers imported. ${summary.skippedCount} skipped, ${summary.errorCount} errors.`
      );
    } catch (err: any) {
      error('Import Execution Failed', err?.message);
    }
  };

  // Blank template download helper
  const downloadSampleTemplate = () => {
    const csvContent =
      'Student Name,Mobile Number,Hostel Name,Room Number,Package,Package Price,Yearly Wash Limit,Used Washes,Package Start Date,Package End Date,Customer ID\n' +
      'Gampa Saicharan,9948445878,Ganga Hostel,,Premium,6500,34,0,,,FFL-0001\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'fabricfold_customer_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Original Data Import Workflow</h1>
          <p className="text-xs text-slate-500">
            Upload your original customer CSV records with column mapping, duplicate detection, and pre-commit validation.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" /> Download Blank CSV Template
        </button>
      </div>

      {/* Step Indicator */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-bold">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-teal-700' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 'upload' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>1</span>
            <span>Upload File</span>
          </div>

          <div className="h-0.5 w-12 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step === 'mapping' ? 'text-teal-700' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 'mapping' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>2</span>
            <span>Map Columns</span>
          </div>

          <div className="h-0.5 w-12 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-teal-700' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 'preview' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>3</span>
            <span>Validate & Preview</span>
          </div>

          <div className="h-0.5 w-12 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step === 'summary' ? 'text-teal-700' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 'summary' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>4</span>
            <span>Summary</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-center">
          <div className="max-w-md mx-auto border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-8 transition-colors bg-slate-50/50">
            <FileSpreadsheet className="w-12 h-12 text-teal-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Select or Drop Your Customer Data File</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Supports CSV, TSV, or spreadsheet text files (.csv, .tsv, .txt)
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all">
              <Upload className="w-4 h-4" /> Choose CSV File
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-xl mx-auto text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              Preserving Original Data Rules:
            </div>
            <ul className="list-disc pl-5 text-slate-600 space-y-1 text-[11px]">
              <li>Unsupplied columns (e.g. room numbers, dates) will remain blank and will not be fabricated.</li>
              <li>Existing customer records (such as Gampa Saicharan) will be protected against unwanted overwrites.</li>
              <li>You can review every row and resolve duplicates before committing changes to storage.</li>
            </ul>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 'mapping' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Map File Columns to Customer Fields</h3>
              <p className="text-xs text-slate-500">File: {fileName} ({headers.length} columns detected)</p>
            </div>
            <button
              onClick={() => setStep('upload')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to File
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Student Name * <span className="text-rose-600">(Required)</span>
              </label>
              <select
                value={mapping.name}
                onChange={e => setMapping({ ...mapping, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="">-- Select Column --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Mobile Number * <span className="text-rose-600">(Required)</span>
              </label>
              <select
                value={mapping.mobile}
                onChange={e => setMapping({ ...mapping, mobile: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="">-- Select Column --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer ID (Optional)
              </label>
              <select
                value={mapping.customerId}
                onChange={e => setMapping({ ...mapping, customerId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Auto-generate if blank --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hostel Residence Name (Optional)
              </label>
              <select
                value={mapping.hostelName}
                onChange={e => setMapping({ ...mapping, hostelName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Default to Ganga Hostel --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Room Number (Optional)
              </label>
              <select
                value={mapping.roomNumber}
                onChange={e => setMapping({ ...mapping, roomNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Leave blank if unsupplied --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Package Tier (Optional)
              </label>
              <select
                value={mapping.packageName}
                onChange={e => setMapping({ ...mapping, packageName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Default to PREMIUM --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Total Yearly Washes (Optional)
              </label>
              <select
                value={mapping.totalWashes}
                onChange={e => setMapping({ ...mapping, totalWashes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Default to 34 washes --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Used Washes (Optional)
              </label>
              <select
                value={mapping.usedWashes}
                onChange={e => setMapping({ ...mapping, usedWashes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Default to 0 used --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={handleProceedToPreview}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Proceed to Validation & Preview <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Duplicate Resolution */}
      {step === 'preview' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Validate Data & Duplicate Handling</h3>
              <p className="text-xs text-slate-500">
                {parsedRows.length} rows evaluated: {parsedRows.filter(r => r.isValid).length} Valid, {parsedRows.filter(r => r.isDuplicate).length} Duplicates detected
              </p>
            </div>

            {/* Duplicate strategy selection */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">When duplicate found:</span>
              <select
                value={duplicateStrategy}
                onChange={e => setDuplicateStrategy(e.target.value as any)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-800"
              >
                <option value="skip">Skip duplicates (Keep existing records)</option>
                <option value="update">Update existing records with new values</option>
              </select>
            </div>
          </div>

          {/* Row-by-row table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Row</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Hostel</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Package / Limit</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {parsedRows.map(row => (
                  <tr key={row.rowNumber} className={!row.isValid ? 'bg-rose-50/50' : row.isDuplicate ? 'bg-amber-50/40' : ''}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-500">#{row.rowNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.data.name || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{row.data.mobile || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.data.hostel_name || 'Ganga Hostel'}</td>
                    <td className="py-2.5 px-3 text-slate-500 italic">{row.data.room_number || '(blank)'}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{row.data.package_name}</span> ({row.data.total_washes}w)
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {!row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Error
                        </span>
                      ) : row.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Duplicate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {row.errors.length > 0 ? (
                        <span className="text-rose-600 font-semibold">{row.errors.join(', ')}</span>
                      ) : row.warnings.length > 0 ? (
                        <span className="text-amber-700">{row.warnings.join(' ')}</span>
                      ) : (
                        <span className="text-slate-400">Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep('mapping')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Mapping
            </button>

            <button
              onClick={handleExecuteImport}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm & Execute Import
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Import Summary */}
      {step === 'summary' && importSummary && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Import Process Completed</h2>
            <p className="text-xs text-slate-500 mt-1">Your original customer dataset has been processed into storage.</p>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Rows</span>
              <span className="text-xl font-black text-slate-900 font-mono">{importSummary.totalRows}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 block uppercase font-bold">Imported</span>
              <span className="text-xl font-black text-emerald-800 font-mono">{importSummary.importedCount}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-[10px] text-amber-700 block uppercase font-bold">Duplicates</span>
              <span className="text-xl font-black text-amber-800 font-mono">{importSummary.skippedCount}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-[10px] text-rose-700 block uppercase font-bold">Errors</span>
              <span className="text-xl font-black text-rose-800 font-mono">{importSummary.errorCount}</span>
            </div>
          </div>

          {/* Error detail list if any */}
          {importSummary.errors.length > 0 && (
            <div className="max-w-md mx-auto text-left p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs">
              <span className="font-bold text-rose-800 block mb-1">Errors Skipped:</span>
              <ul className="list-disc pl-5 text-rose-700 space-y-0.5 text-[11px]">
                {importSummary.errors.map((e, idx) => (
                  <li key={idx}>Row #{e.row}: {e.reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setStep('upload');
                setFileContent('');
                setFileName('');
              }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
            >
              Upload Another File
            </button>

            {onNavigateCustomers && (
              <button
                onClick={onNavigateCustomers}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" /> View Customers Directory
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
