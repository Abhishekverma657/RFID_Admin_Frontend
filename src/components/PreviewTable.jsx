// import React from 'react';
// export default function PreviewTable({ rows }) {
//   return (
//     <table className="w-full mt-6 border rounded-xl">
//       <thead className="bg-gray-200">
//         <tr>
//           {Object.keys(rows[0]).map((key) => (
//             <th key={key} className="p-3 text-left capitalize">{key}</th>
//           ))}
//         </tr>
//       </thead>

//       <tbody>
//         {rows.map((row, i) => (
//           <tr key={i} className="border-b hover:bg-gray-50">
//             {Object.values(row).map((v, j) => (
//               <td key={j} className="p-3">{v}</td>
//             ))}
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

import React from "react";

export default function PreviewTable({ rows, onEdit, onAddRow, errors }) {
  const cols = Object.keys(rows[0]);

  return (
    <>
      <button
        onClick={onAddRow}
        className="mt-4 mb-2 px-4 py-1 bg-green-600 text-white rounded"
      >
         Add Row
      </button>

      <table className="w-full border rounded-xl">
        <thead className="bg-gray-200">
          <tr>
            {cols.map((c) => (
              <th key={c} className="p-3 capitalize">{c}</th>
            ))}
            <th className="p-3">Error</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b ${errors[i] ? "bg-red-50" : ""}`}
            >
              {cols.map((c) => (
                <td key={c} className="p-2">
                  <input
                    value={row[c]}
                    onChange={(e) => onEdit(i, c, e.target.value)}
                    className="w-full border px-2 py-1 rounded"
                  />
                </td>
              ))}
              <td className="p-2 text-red-600 text-sm">
                {errors[i]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

