import { Button, Modal } from 'react-bootstrap';

export default function ConfirmModal({ show, title, children, confirmLabel = 'Delete', variant = 'danger', busy = false, onConfirm, onHide }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={busy}>
          Cancel
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
