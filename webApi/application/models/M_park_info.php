<?php

class M_park_info extends CI_Model
{

    public function __construct()
    {
        // connected database
        $this->load->database();
    }

    public function get_card_info_by_id($id)
    {
        // db : database
        // type 1
        // $card = $this->db->get('card_info')->where('id',$id);

//        // type 2
//        $card1 = $this->db->get_where('card_info', array('id' => $id))->result_array();
        $card = $this->db->get_where('card_info', array('id' => $id))->row_array();
        return $card;
    }

    public  function set_flag_by_id($id,$num_flag)
    {
        $this->db->set('flag',$num_flag);
        $this->db->where('id',$id);
        $this->db->update('card_info');
    }
    public  function set_car_code_by_condition($id,$str_car_code)
    {
        $this->db->set('car_code',$str_car_code);
        $this->db->where('id',$id);
        $this->db->update('card_info');
    }
    public function get_car_info(){
        $slot_for_guest= $this->db->query("SELECT count(flag) as countflag FROM card_info WHERE flag = 0 && is_member=0 ");
        return $slot_for_guest->row_array();
    }
}