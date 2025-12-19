
import React from "react";
import { Field, ErrorMessage } from "formik";

export default function FieldArea({ label, name, required, maxLength, value, ...props }) {
  const currentLength = (value || '').length;
  const isExceeding = maxLength && currentLength > maxLength;

  return (
    <div className="mb-3">
      <label className="block text-[15px] font-medium text-blue-900 mb-1">
        {label}
        {required && <span className="text-red-600 text-[18px]"> *</span>}
      </label>
      <div className="relative transition-transform duration-200 focus-within:scale-105 rounded-md">
        <Field
          name={name}
          {...props}
          className="border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none py-2 px-3 rounded-md shadow-sm text-gray-800 w-full transition-all duration-200"
        />
        {maxLength && (
          <div className={`absolute bottom-2 right-2 text-xs ${
            isExceeding ? 'text-red-500 font-medium' : 'text-gray-500'
          }`}>
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
      <ErrorMessage name={name} component="div" className="text-red-500 text-xs mt-1" />
    </div>
  );
}
