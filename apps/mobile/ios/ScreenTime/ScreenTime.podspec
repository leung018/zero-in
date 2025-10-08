require 'json'
package = JSON.parse(File.read(File.join(__dir__, '../../../../package.json')))

Pod::Spec.new do |s|
  s.name           = "ScreenTime"
  s.version        = package['version']
  s.summary        = "A module to interact with the Screen Time API."
  s.homepage       = "https://github.com/your-repo/zero-in" # Replace with your actual homepage
  s.license        = package['license']
  s.author         = { "Your Name" => "your.email@example.com" } # Replace with your info
  s.platform       = :ios, "15.1"
  s.source         = { :path => "." }
  s.source_files   = "**/*.{h,m,swift}"
  s.dependency 'React-Core'
end
