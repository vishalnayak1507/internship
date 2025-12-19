
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function FieldSelect({ label, value, onChange, options, required, disabled, selectClassName }) {
  // Find the selected option
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="mb-3 w-full">
      {label && (
        <label className="block text-[15px] font-medium text-blue-900 mb-1 text-left">
          {label}
          {required && <span className="text-red-600 text-[18px]"> *</span>}
        </label>
      )}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={`border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none py-2 px-3 rounded-md bg-white shadow-sm text-black w-full text-sm text-left transition-all duration-150 pr-8 ${selectClassName || ""} ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          >
            {/* Show only code if selected, else placeholder */}
            {selectedOption ? selectedOption.value : `Select ${label}`}
            {/* Dropdown icon */}
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="transform scale-y-75 opacity-0"
            enterTo="transform scale-y-100 opacity-100"
            leave="transition ease-in duration-100"
            leaveFrom="transform scale-y-100 opacity-100"
            leaveTo="transform scale-y-75 opacity-0"
          >
            <Listbox.Options className="absolute mt-1 w-full bg-white shadow-lg rounded-md z-10 max-h-48 overflow-auto origin-top transition-all list-none">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  as={Fragment}
                >
                  {({ active, selected }) => (
                    <li
                      className={`cursor-pointer select-none py-2 px-3 text-sm rounded ${
                        active ? "bg-blue-200 text-blue-700" : ""
                      } ${selected ? "font-bold" : ""}`}
                    >
                      {option.label}
                    </li>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}