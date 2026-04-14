#!/usr/bin/env python3
import re

# Read the original compiled.css
with open('src/compiled.css', 'r') as f:
    compiled_content = f.read()

# Replace old fadeInUp with new translate3d version
old_fadeup = r'@keyframes fadeInUp\{from\{opacity:0;transform:translateY\(60px\) scale\(0\.95\);filter:blur\(10px\)\}to\{opacity:1;transform:translateY\(0\) scale\(1\);filter:blur\(0\)\}\}'
new_fadeup = '@keyframes fadeInUp{from{opacity:0;transform:translate3d(0,60px,0) scale(0.95);filter:blur(10px)}to{opacity:1;transform:translate3d(0,0,0) scale(1);filter:blur(0)}}'
compiled_content = re.sub(old_fadeup, new_fadeup, compiled_content)

# If fadeInUp doesn't exist, append it
if '@keyframes fadeInUp' not in compiled_content:
    compiled_content += new_fadeup

# Fix .reveal to add will-change
old_reveal = '.reveal{opacity:0;transition:opacity .5s ease}'
new_reveal = '.reveal{opacity:0;transition:opacity .5s ease;will-change:opacity,transform}'
compiled_content = compiled_content.replace(old_reveal, new_reveal)

# Write back
with open('src/compiled.css', 'w') as f:
    f.write(compiled_content)

print("✅ CSS animations updated successfully")
