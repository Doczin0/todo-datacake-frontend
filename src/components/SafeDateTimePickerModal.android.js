import React, { memo, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import DateTimePicker from "@react-native-community/datetimepicker";

// React Native's DateTimePicker has a long standing Android bug where the picker briefly
// flickers when props change. The upstream modal library wraps the picker with `memo`
// to avoid that, but it also relied on `defaultProps`, which React now warns about.
// This copy mirrors the upstream logic while switching to JS default parameters so we
// don't trigger the warning on React Native 0.74+.
const areEqual = (prevProps, nextProps) =>
  prevProps.isVisible === nextProps.isVisible &&
  prevProps.date.getTime() === nextProps.date.getTime();

const DateTimePickerModalComponent = ({
  date = new Date(),
  mode,
  isVisible = false,
  onCancel,
  onConfirm,
  onHide = () => {},
  ...otherProps
}) => {
  const currentDateRef = useRef(date);
  const [currentMode, setCurrentMode] = useState(null);

  useEffect(() => {
    if (isVisible && currentMode === null) {
      setCurrentMode(mode === "time" ? "time" : "date");
    } else if (!isVisible) {
      setCurrentMode(null);
    }
  }, [isVisible, currentMode, mode]);

  if (!isVisible || !currentMode) {
    return null;
  }

  const handleChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      onCancel();
      onHide(false);
      return;
    }

    let nextDate = selectedDate;

    if (mode === "datetime") {
      if (currentMode === "date") {
        setCurrentMode("time");
        currentDateRef.current = new Date(selectedDate);
        return;
      }

      if (currentMode === "time") {
        const year = currentDateRef.current.getFullYear();
        const month = currentDateRef.current.getMonth();
        const day = currentDateRef.current.getDate();
        const hours = selectedDate.getHours();
        const minutes = selectedDate.getMinutes();
        nextDate = new Date(year, month, day, hours, minutes);
      }
    }

    onConfirm(nextDate);
    onHide(true, nextDate);
  };

  return (
    <DateTimePicker
      {...otherProps}
      mode={currentMode}
      value={date}
      onChange={handleChange}
    />
  );
};

const DateTimePickerModal = memo(DateTimePickerModalComponent, areEqual);

DateTimePickerModal.propTypes = {
  date: PropTypes.instanceOf(Date),
  isVisible: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onHide: PropTypes.func,
  maximumDate: PropTypes.instanceOf(Date),
  minimumDate: PropTypes.instanceOf(Date)
};

export default DateTimePickerModal;
