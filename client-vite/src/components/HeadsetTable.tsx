import React from 'react';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import { HeadsetWithStatus } from '../types';

interface HeadsetTableProps {
  headsets: HeadsetWithStatus[];
  selectedRows: GridRowSelectionModel;
  onSelectionChange: (selection: GridRowSelectionModel) => void;
  getRowClassName: (params: any) => string;
}

const HeadsetTable: React.FC<HeadsetTableProps> = ({
  headsets,
  selectedRows,
  onSelectionChange,
  getRowClassName,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'success';
      case 'In Use':
        return 'error';
      case 'Account in use':
        return 'warning';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 150,
      headerAlign: 'center',
    },
    {
      field: 'model',
      headerName: 'Model',
      width: 120,
      headerAlign: 'center',
    },
    {
      field: 'account_id',
      headerName: 'Account',
      width: 120,
      headerAlign: 'center',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'priorityDisplay',
      headerName: 'Priority',
      width: 150,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'last_used',
      headerName: 'Last Used',
      width: 200,
      headerAlign: 'center',
      renderCell: (params) => {
        const date = new Date(params.value);
        return date.toLocaleString();
      },
    },
  ];

  return (
    <div style={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={headsets}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectedRows}
        onRowSelectionModelChange={onSelectionChange}
        getRowClassName={getRowClassName}
        sx={{
          '& .suggested-row': {
            backgroundColor: 'rgba(120, 255, 120, 0.3)',
            '&:hover': {
              backgroundColor: 'rgba(120, 255, 120, 0.4)',
            },
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 },
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};

export default HeadsetTable;
