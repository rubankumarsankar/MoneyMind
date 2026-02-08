import Swal from 'sweetalert2';

// Success alert
export const showSuccess = (title, text = '') => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#10B981',
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl shadow-2xl',
    },
  });
};

// Error alert
export const showError = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#EF4444',
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl shadow-2xl',
    },
  });
};

// Warning alert
export const showWarning = (title, text = '') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#F59E0B',
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl shadow-2xl',
    },
  });
};

// Info alert
export const showInfo = (title, text = '') => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonColor: '#3B82F6',
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl shadow-2xl',
    },
  });
};

// Confirm dialog
export const showConfirm = (title, text = '', confirmText = 'Yes', cancelText = 'Cancel') => {
  return Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: '#3B82F6',
    cancelButtonColor: '#6B7280',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl shadow-2xl',
    },
  });
};

// Delete confirm dialog
export const showDeleteConfirm = (title = 'Are you sure?', text = 'This action cannot be undone!') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl shadow-2xl',
    },
  });
};

// Loading toast
export const showLoading = (title = 'Loading...') => {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    showConfirmButton: false,
    background: '#ffffff',
    customClass: {
      popup: 'rounded-2xl shadow-2xl',
    },
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close loading
export const closeLoading = () => {
  Swal.close();
};

// Toast notification (top-right)
export const showToast = (icon, title) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-xl shadow-lg',
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  return Toast.fire({ icon, title });
};

export default Swal;
