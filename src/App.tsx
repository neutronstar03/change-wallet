import { useCallback, useEffect, useState } from 'react';
import './App.css';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Box } from '@mui/system';
import { Stack } from '@mui/material';
import {
  getImpersonationAddress,
  getLastUsedAddress,
  startImpersonation,
  stopImpersonation,
} from './common';

const App = () => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState<string>('');

  const loadAndSetImpersonationAddress = useCallback(async () => {
    console.log('Getting impersonation status');

    const currentImpersonationAddress = await getImpersonationAddress();
    const lastUsedAddress = await getLastUsedAddress();
    const updatedAddress = currentImpersonationAddress || lastUsedAddress;

    if (updatedAddress) {
      setAddress(updatedAddress);
    }
    setIsImpersonating(!!currentImpersonationAddress);
  }, []);

  // on mount
  useEffect(() => {
    loadAndSetImpersonationAddress().catch(error => setError(String(error.message ?? error)));
  }, []);

  const handleClick = async () => {
    setError('');
    setBusy(true);
    try {
      if (isImpersonating) {
        await stopImpersonation();
      }
      else {
        await startImpersonation(address.trim());
      }
      setIsImpersonating(!isImpersonating);
    }
    catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
    finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Box>
        <Stack spacing={2}>
          <h1>Change Wallet</h1>
          <p>Enter a wallet address to present it to the current dApp.</p>
          <TextField
            label="Address"
            inputProps={{ style: { color: 'white' } }}
            className="text-box"
            disabled={isImpersonating}
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          <Button variant="contained" disabled={busy} onClick={handleClick}>
            {isImpersonating ? 'Stop' : 'Start'}
          </Button>
          <p role="alert">{error}</p>
          <p className="bottom-text">Connect your existing wallet first. Signing and transactions still use that wallet.</p>
        </Stack>
      </Box>
    </div>
  );
};

export default App;
