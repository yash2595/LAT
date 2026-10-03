<?php
$file = 'public/results.html';
$content = file_get_contents($file);

// Replace the Evaluation card
$search = '<div
                class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-[13px] font-medium text-slate-500">Evaluation</p>

                    <strong
                      class="block mt-2 text-sm font-bold text-slate-600"
                    >
                      <span data-result="evaluation">Pending</span>
                    </strong>
                  </div>

                  <div
                    class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"
                  >
                    <i data-lucide="file-check-2" class="w-4 h-4"></i>
                  </div>
                </div>

              </div>';

$search = str_replace("\r\n", "\n", $search);
$content = str_replace("\r\n", "\n", $content);

$replace = '<div class="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <i data-lucide="file-check-2" class="w-4 h-4"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Evaluation</p>
                  <p class="text-sm font-bold text-slate-700 truncate"><span data-result="evaluation">Pending</span></p>
                </div>
              </div>';

$content = str_replace($search, $replace, $content);
file_put_contents($file, $content);
echo "Done";
