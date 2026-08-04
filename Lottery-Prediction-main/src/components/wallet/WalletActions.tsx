import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useWallet } from '../../contexts/WalletContext';
import { FaPlus, FaMinus, FaCreditCard, FaGift } from 'react-icons/fa';

interface WalletActionsProps {
  show: boolean;
  onHide: () => void;
  action: 'deposit' | 'withdraw' | 'payment' | 'bonus' | null;
}

const WalletActions: React.FC<WalletActionsProps> = ({ show, onHide, action }) => {
  const { 
    wallet, 
    loading, 
    depositFunds, 
    withdrawFunds, 
    makePayment, 
    addBonus,
    formatCurrency 
  } = useWallet();

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    reference: '',
    metadata: {}
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (action === 'payment' || action === 'bonus') {
      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      }
    }

    if (action === 'withdraw' && wallet) {
      if (parseFloat(formData.amount) > wallet.balance) {
        newErrors.amount = 'Insufficient balance';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      const data = {
        amount,
        description: formData.description,
        reference: formData.reference || undefined,
        metadata: formData.metadata
      };

      let success = false;

      switch (action) {
        case 'deposit':
          success = await depositFunds(data);
          break;
        case 'withdraw':
          success = await withdrawFunds(data);
          break;
        case 'payment':
          success = await makePayment(data);
          break;
        case 'bonus':
          success = await addBonus(data);
          break;
      }

      if (success) {
        handleClose();
      }
    } catch (error) {
      console.error('Transaction error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      description: '',
      reference: '',
      metadata: {}
    });
    setErrors({});
    onHide();
  };

  const getModalTitle = () => {
    switch (action) {
      case 'deposit': return 'Add Funds';
      case 'withdraw': return 'Withdraw Funds';
      case 'payment': return 'Make Payment';
      case 'bonus': return 'Add Bonus';
      default: return 'Wallet Action';
    }
  };

  const getModalIcon = () => {
    switch (action) {
      case 'deposit': return <FaPlus className="text-success" />;
      case 'withdraw': return <FaMinus className="text-danger" />;
      case 'payment': return <FaCreditCard className="text-primary" />;
      case 'bonus': return <FaGift className="text-warning" />;
      default: return null;
    }
  };

  const getDescriptionPlaceholder = () => {
    switch (action) {
      case 'deposit': return 'e.g., Bank transfer, Credit card';
      case 'withdraw': return 'e.g., Bank transfer to account ending in 1234';
      case 'payment': return 'e.g., Payment for lottery prediction service';
      case 'bonus': return 'e.g., Welcome bonus, Referral reward';
      default: return 'Enter description';
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {getModalIcon()}
          <span className="ms-2">{getModalTitle()}</span>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {wallet && (
            <Alert variant="info" className="mb-3">
              <strong>Current Balance:</strong> {formatCurrency(wallet.balance)}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Amount *</Form.Label>
                <Form.Control
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  isInvalid={!!errors.amount}
                  disabled={isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.amount}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Reference (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  placeholder="Transaction reference"
                  disabled={isSubmitting}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>
              Description {action === 'payment' || action === 'bonus' ? '*' : '(Optional)'}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={getDescriptionPlaceholder()}
              isInvalid={!!errors.description}
              disabled={isSubmitting}
            />
            <Form.Control.Feedback type="invalid">
              {errors.description}
            </Form.Control.Feedback>
          </Form.Group>

          {action === 'withdraw' && wallet && (
            <Alert variant="warning">
              <strong>Note:</strong> Withdrawal requests may take 1-3 business days to process.
            </Alert>
          )}

          {action === 'payment' && (
            <Alert variant="info">
              <strong>Note:</strong> This will deduct the amount from your wallet balance immediately.
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              `Confirm ${getModalTitle()}`
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default WalletActions;







