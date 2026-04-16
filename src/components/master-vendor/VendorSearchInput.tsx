import React, { useId, useMemo } from 'react';
import { useMasterVendorStore } from '../../store/masterVendorStore';
import type { MasterVendor } from '../../types';

interface VendorSearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  onVendorSelect?: (vendor: MasterVendor) => void;
  placeholder?: string;
  className?: string;
}

const VendorSearchInput: React.FC<VendorSearchInputProps> = ({
  value = '',
  onChange,
  onVendorSelect,
  placeholder = 'Cari atau ketik nama vendor',
  className,
}) => {
  const listId = useId();
  const vendors = useMasterVendorStore((s) => s.data);

  const activeVendors = useMemo(
    () => vendors.filter((vendor) => vendor.status === 'Aktif'),
    [vendors]
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    onChange(nextValue);

    const selectedVendor = activeVendors.find(
      (vendor) => vendor.namaVendor.toLowerCase() === nextValue.toLowerCase()
    );

    if (selectedVendor) {
      onVendorSelect?.(selectedVendor);
    }
  };

  return (
    <>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
      <datalist id={listId}>
        {activeVendors.map((vendor) => (
          <option key={vendor.id} value={vendor.namaVendor}>
            {vendor.kodeVendor} - {vendor.npwp}
          </option>
        ))}
      </datalist>
    </>
  );
};

export default VendorSearchInput;
