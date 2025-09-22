import * as React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ExampleLineItemsTable from './features/example/ExampleLineItemsTable';

function App() {
  return (
    <>
      <CssBaseline />
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            TreeTable Demo
          </Typography>
          <ExampleLineItemsTable />
        </Box>
    </>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');
createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
