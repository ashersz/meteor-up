sudo mkdir -p <%= appRemote %>/<%= appName %>/
sudo mkdir -p <%= appRemote %>/<%= appName %>/config
sudo mkdir -p <%= appRemote %>/<%= appName %>/tmp

# Creating a system user
sudo useradd -r <%= appUser %>

#sudo chown -R ${USER}:${USER} <%= appRemote %>/<%= appName %>
touch <%= appLog %>/meteor.log
sudo chown <%= appUser %>:<%= appUser %> <%= appLog %>/meteor.log

# install firewalld
sudo yum install firewalld -y
#to do open appPort, if 3000 redirect 80 to 3000, open 27017 or mongo port
#sudo npm install -g forever userdown wait-for-mongo node-gyp

# allow appUser to run the appName service
sudo -s
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl restart <%= appName %>.service" >> /etc/sudoers
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl start <%= appName %>.service" >> /etc/sudoers
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl stop <%= appName %>.service" >> /etc/sudoers
exit
