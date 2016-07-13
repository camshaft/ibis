module.exports = function(client, onChange) {
  var canCancel = !!client.cancel;

  return function createAction(name) {
    var request;

    function action(changeset) {
      if (!canSubmit(changeset)) return null;

      return function submission(done) {
        if (!canSubmit(changeset)) return;
        action.canSubmit = false;
        action.canReset = canCancel;
        action.isSubmitting = true;

        request = client.submit(changeset.data, function(err, response) {
          request = null;
          action.canReset = true;
          action.isSubmitting = false;
          action.isFinished = true;
          action.error = err;
          action.response = response;
          onChange(action, name);
          if (typeof done === 'function') done(action);
        });

        onChange(action, name);
      };
    }

    function canSubmit(changeset) {
      return !(!changeset || !changeset.isValid || action.isSubmitting || action.isFinished);
    }

    function cancel() {
      if (canCancel) {
        client.cancel(request);
        return true;
      } else {
        return false;
      }
    }

    action.reset = function(shouldUpdate) {
      if (action.isSubmitting && !cancel()) return false;
      action.canSubmit = true;
      action.canReset = true;
      action.isSubmitting = false;
      action.isFinished = false;
      delete action.error;
      delete action.response;
      if (shouldUpdate !== false) onChange(action, name);
      return true;
    };

    action.reset(false);

    return action;
  };
};
