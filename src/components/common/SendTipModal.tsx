import React, { useState, forwardRef, useImperativeHandle } from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Snackbar from '@material-ui/core/Snackbar';
import TextField from '@material-ui/core/TextField';
import SendIcon from '@material-ui/icons/Send';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

import { sendTip } from '../../helpers/polkadotApi';
import DialogTitle from '../common/DialogTitle.component';
import { useStyles } from '../login/login.style';
import { BalanceComponent } from '../wallet/balance.component';
import { useBalance } from '../wallet/use-balance.hooks';

import * as WalletAddressAPI from 'src/lib/api/wallet';

interface InputState {
  amount: string;
}

interface InputErorState {
  isErrorInput: boolean;
  isTextChanged: boolean;
  isInsufficientBalance: boolean;
  errorMessage: string;
}

interface SendTipConfirmed {
  isConfirmed: boolean;
  message: string;
}

type Props = {
  userAddress: string;
  postId?: string;
  freeBalance: number;
};

const SendTipModal = forwardRef(({ userAddress, postId, freeBalance }: Props, ref) => {
  const { loadInitBalance } = useBalance(userAddress);
  const [sendTipConfirmed, setSendTipConfirmed] = useState<SendTipConfirmed>({
    isConfirmed: false,
    message: ''
  });

  const [errorSendTips, setErrorSendTips] = useState({
    isError: false,
    message: null
  });

  const [showSendTipModal, setShowSendTipModal] = useState(false);
  const [inputError, setInputError] = useState<InputErorState>({
    isErrorInput: false,
    isTextChanged: false,
    isInsufficientBalance: false,
    errorMessage: 'Put digits bigger than zero'
  });
  const [values, setValues] = useState<InputState>({
    amount: ''
  });
  const styles = useStyles();

  useImperativeHandle(ref, () => ({
    triggerSendTipModal: () => {
      setShowSendTipModal(true);
    }
  }));

  const closeSendTipModal = () => {
    setShowSendTipModal(false);
    setInputError({
      ...inputError,
      isTextChanged: false,
      isErrorInput: false
    });
  };

  const [errorText, setErrorText] = useState({
    isError: false,
    message: ''
  });
  const handleCloseError = () => {
    setErrorText({
      ...errorText,
      isError: false
    });
  };

  const checkAmountThenSend = async () => {
    const regexValidDigits = /^\d*(\.\d+)?$/;
    if (values.amount === '') {
      setInputError({
        ...inputError,
        isErrorInput: false,
        isTextChanged: true
      });
    }
    if (regexValidDigits.test(values.amount)) {
      setInputError({
        ...inputError,
        isErrorInput: false,
        isTextChanged: true
      });

      if (Number(values.amount) >= freeBalance) {
        setInputError({
          ...inputError,
          isErrorInput: true,
          isTextChanged: true,
          isInsufficientBalance: true,
          errorMessage: 'Insufficient balance'
        });
      } else {
        // amount valid, reset InputError state
        setInputError({
          isErrorInput: false,
          isTextChanged: true,
          isInsufficientBalance: false,
          errorMessage: ''
        });
        const amountSent = Number(values.amount) * 1000000000000;
        // sendTip will open a pop-up from polkadot.js extension,
        // tx signing is done by supplying a password
        const senderAddress = userAddress;

        const { walletAddress } = await WalletAddressAPI.getWalletAddress(postId as string);

        const response = await sendTip(senderAddress, walletAddress, amountSent);
        // handle if sendTip succeed
        if (response.Error || typeof response === 'string') {
          console.log('response is: ', response);
          setErrorSendTips({
            ...errorSendTips,
            isError: true,
            message: response.Error || response
          });
          setShowSendTipModal(false);
          setValues({
            ...values,
            amount: ''
          });
          return;
        }
        if (response.from === senderAddress) {
          console.log('response : ', response);
          setSendTipConfirmed({
            isConfirmed: true,
            message: 'Tip sent successfully!'
          });
          setShowSendTipModal(false);
          setValues({
            ...values,
            amount: ''
          });
          loadInitBalance();
        }
      }
    } else {
      setErrorText({
        ...errorText,
        isError: true,
        message: 'Send tips failed!'
      });

      setInputError({
        ...inputError,
        isErrorInput: true,
        isTextChanged: true,
        isInsufficientBalance: false
      });
    }
  };

  const handleChange = (prop: keyof InputState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleClose = () => {
    setSendTipConfirmed({
      ...sendTipConfirmed,
      isConfirmed: false
    });
  };

  const handleCloseErrorSendTips = () => {
    setErrorSendTips({
      ...errorSendTips,
      isError: false
    });
  };

  return (
    <>
      <Dialog open={showSendTipModal} onClose={closeSendTipModal} aria-labelledby="form-dialog-title" maxWidth="md">
        <DialogTitle id="name" onClose={closeSendTipModal}>
          {' '}
          Send Tip
        </DialogTitle>
        <DialogContent dividers>
          <BalanceComponent />
        </DialogContent>
        <DialogContent dividers>
          <form noValidate autoComplete="off">
            <TextField
              value={values.amount}
              onChange={handleChange('amount')}
              required
              error={inputError.isErrorInput ? true : false}
              id="sendTipAmount"
              label="How many MYRIA?"
              helperText={
                inputError.isErrorInput
                  ? inputError.isInsufficientBalance
                    ? inputError.errorMessage
                    : 'Put digits bigger than zero!'
                  : 'Please input valid digits'
              }
              variant="outlined"
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button className={styles.whiteLightButton} fullWidth={true} size="large" variant="contained" onClick={closeSendTipModal}>
            Cancel
          </Button>
          <Button
            className={styles.lightButton}
            fullWidth={true}
            size="large"
            variant="contained"
            startIcon={<SendIcon />}
            onClick={checkAmountThenSend}>
            Send
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={sendTipConfirmed.isConfirmed} autoHideDuration={3000} onClose={handleClose}>
        <Alert severity="success">
          <AlertTitle>Success!</AlertTitle>
          {sendTipConfirmed.message}
        </Alert>
      </Snackbar>

      <Snackbar open={errorText.isError} autoHideDuration={3000} onClose={handleCloseError}>
        <Alert severity="error">
          <AlertTitle>Error!</AlertTitle>
          {errorText.message}
        </Alert>
      </Snackbar>

      <Snackbar open={errorSendTips.isError} autoHideDuration={3000} onClose={handleCloseErrorSendTips}>
        <Alert severity="error">
          <AlertTitle>Error!</AlertTitle>
          {errorSendTips.message}
        </Alert>
      </Snackbar>
    </>
  );
});

export default SendTipModal;
