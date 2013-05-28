
bindir = File.dirname(__FILE__) + "/../bin"
outdir = File.dirname(__FILE__) + "/../out"

namespace "jsdata" do
    appdir = "data"

    tasks = []
    jsonp_files = FileList[appdir + "/**/*.jsonp"]
    jsonp_files.each do |f|
        destfile = "out/" + f
        d = File.dirname(destfile)
        if not tasks.include?(d)
            directory d
            tasks.push(d)
        end
        file destfile => [f] do
            sh "cp #{f} #{destfile}"
        end
        tasks.push(destfile)
    end


    coffee_files = FileList[appdir + "/**/*.coffee"]
    coffee_files.each do |f|
        puts bindir
        puts outdir
        destfile = outdir + "/" + f.gsub('.coffee', '.js')
        puts destfile
        d = File.dirname(destfile)
        if not tasks.include?(d)
            directory d
            tasks.push(d)
        end
        file destfile => [f] do
            d = File.dirname(f)
            b = File.basename(f)
            sh "(cd #{d};#{bindir}/browjadify --runtime=n --entry=#{b} >#{destfile})"
        end
        tasks.push(destfile)
    end

    task :do => tasks
end


